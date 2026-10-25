import { Prisma, type Booking } from "@prisma/client";
import type Stripe from "stripe";
import { BOOKING, SITE, simById } from "@/config/site";
import { isFree, validStart } from "./availability";
import { prisma } from "./db";
import { sendEmail, sendSms } from "./notify";
import { createCheckout, expireCheckout, refund, stripe } from "./payments";
import { quote } from "./pricing";
import { cancelledEmail, confirmationEmail, confirmationSms, rescheduledEmail, staffEmail } from "./templates";
import { MIN } from "./time";
import { bookingCode } from "./tokens";

export class BookingError extends Error {
  constructor(public code: "slot_taken" | "invalid" | "closed" | "not_allowed" | "too_soon") {
    super(code);
  }
}

/** Baza odrzuciła zapis, bo termin nachodzi na inną aktywną rezerwację (constraint booking_no_overlap). */
export function isOverlapError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  return msg.includes("booking_no_overlap") || msg.includes("23P01");
}

/** Holdy, którym minęło 10 min, zwalniają termin od razu, zanim ktoś spróbuje go kupić (cron robi to też co minutę). */
async function releaseStaleHolds(tx: Prisma.TransactionClient | typeof prisma, simulatorIds: string[], start: Date, end: Date, now = new Date()) {
  const pad = BOOKING.bufferMin * MIN;
  await tx.booking.updateMany({
    where: {
      simulatorId: { in: simulatorIds },
      status: "PENDING",
      holdExpiresAt: { lte: now },
      start: { lt: new Date(end.getTime() + pad) },
      end: { gt: new Date(start.getTime() - pad) },
    },
    data: { status: "EXPIRED" },
  });
}

export type NewBooking = {
  simulatorId?: string;
  simulatorIds?: string[]; // kilka stanowisk na ten sam termin = rezerwacja grupowa z rabatem
  start: Date;
  durationMin: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  discountCode?: string | null;
  userId?: string | null;
  locale: string;
  source?: "ONLINE" | "ADMIN";
  note?: string;
  markPaid?: boolean; // tylko panel obsługi
  payLink?: boolean; // tylko panel obsługi: klient płaci linkiem z SMS-a, termin czeka do BOOKING.payLinkHours
};

/** Do kiedy rezerwacja telefoniczna czeka na zapłatę: payLinkHours, ale najpóźniej 15 min przed startem. */
function payLinkDeadline(start: Date) {
  return new Date(Math.min(Date.now() + BOOKING.payLinkHours * 60 * MIN, start.getTime() - 15 * MIN));
}

export async function createBooking(input: NewBooking) {
  const ids = [...new Set(input.simulatorIds?.length ? input.simulatorIds : input.simulatorId ? [input.simulatorId] : [])];
  const sims = ids.map((id) => simById(id));
  if (!sims.length || sims.some((s) => !s || s.status !== "ACTIVE")) throw new BookingError("invalid");
  const admin = input.source === "ADMIN";
  if (!validStart(input.start, input.durationMin, new Date(), admin)) throw new BookingError("closed");
  const end = new Date(input.start.getTime() + input.durationMin * MIN);
  const q = await quote(ids, input.durationMin, input.discountCode);
  const holdUntil = input.payLink ? payLinkDeadline(input.start) : new Date(Date.now() + BOOKING.holdMin * MIN);
  // Klient musi mieć choć 15 min na zapłatę linkiem.
  if (input.payLink && holdUntil.getTime() < Date.now() + 15 * MIN) throw new BookingError("too_soon");

  // Bez długiej transakcji: przy tysiącach kliknięć każda rezerwacja to kilka krótkich zapytań,
  // a o tym, kto dostał termin, decyduje ograniczenie booking_no_overlap w bazie.
  await releaseStaleHolds(prisma, ids, input.start, end);
  for (const id of ids) if (!(await isFree(prisma, id, input.start, end))) throw new BookingError("slot_taken");
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const locale = input.locale === "en" ? "en" : "pl";
  // Karta gościa: zawsze najświeższe dane z ostatniej rezerwacji (notatka recepcji zostaje).
  const customer = await prisma.customer.upsert({
    where: { email },
    update: { firstName, lastName, phone, locale },
    create: { email, firstName, lastName, phone, locale },
  });
  const codes = q.items.map(() => bookingCode());
  const groupId = ids.length > 1 ? codes[0] : null;
  const rows: Prisma.BookingCreateInput[] = q.items.map((item, i) => ({
    code: codes[i],
    groupId,
    simulator: { connect: { id: item.simulatorId } },
    ...(input.userId ? { user: { connect: { id: input.userId } } } : {}),
    customer: { connect: { id: customer.id } },
    name: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone,
    start: input.start,
    end,
    durationMin: input.durationMin,
    listPriceGross: item.list,
    discountAmount: item.discount,
    discountCode: q.codeApplied ? q.code : null,
    priceGross: item.total,
    status: input.markPaid ? "PAID" : "PENDING",
    paidAt: input.markPaid ? new Date() : null,
    paymentProvider: input.markPaid ? "onsite" : null,
    paymentMethod: input.markPaid ? "ONSITE" : null,
    holdExpiresAt: input.markPaid ? null : holdUntil,
    source: input.source ?? "ONLINE",
    note: input.note ?? (q.groupPercent ? `Rabat grupowy ${q.groupPercent}% (${ids.length} stanowisk)` : undefined),
    locale,
  }));
  // Cała grupa zapisuje się w jednej transakcji albo wcale.
  const bookings: Booking[] = await prisma.$transaction(rows.map((data) => prisma.booking.create({ data }))).catch((e) => {
    // Ktoś inny kupił ten termin w tej samej chwili: baza przepuściła tylko jedną rezerwację.
    if (isOverlapError(e)) throw new BookingError("slot_taken");
    throw e;
  });

  const booking = bookings[0];
  if (input.markPaid) {
    for (const b of bookings) await afterPaid(b);
    return { booking, bookings, checkoutUrl: null };
  }
  const checkout = await createCheckout(bookings, holdUntil);
  if (checkout.ref) await prisma.booking.updateMany({ where: { id: { in: bookings.map((b) => b.id) } }, data: { paymentRef: checkout.ref } });
  return { booking, bookings, checkoutUrl: checkout.url };
}

/** Czy ta rezerwacja dostaje SMS-y (w grupie tylko pierwsza, żeby nie wysyłać kilku na ten sam numer). */
export const smsLead = (b: Booking) => !b.groupId || b.groupId === b.code;

/** Wywoływane przez webhook Stripe albo bramkę testową. Idempotentne. */
export async function markPaid(bookingId: string, ref: { provider: string; ref?: string; method?: string }) {
  const first = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!first?.groupId) return markOnePaid(bookingId, ref);
  const group = await prisma.booking.findMany({ where: { groupId: first.groupId }, orderBy: { createdAt: "asc" } });
  let out = first;
  for (const g of group) {
    const r = await markOnePaid(g.id, ref);
    if (g.id === first.id && r) out = r;
  }
  return out;
}

/** Zapasowe potwierdzenie płatności po powrocie ze Stripe (gdy webhook się spóźnia albo nie dociera). */
export async function syncStripePayment(b: Booking) {
  const s = stripe();
  if (!s || !b.paymentRef || !["PENDING", "EXPIRED"].includes(b.status)) return b;
  const session = await s.checkout.sessions.retrieve(b.paymentRef, { expand: ["payment_intent.payment_method"] }).catch(() => null);
  if (!session || session.payment_status !== "paid") return b;
  const pi = session.payment_intent as Stripe.PaymentIntent | null;
  const method = (pi?.payment_method as Stripe.PaymentMethod | null)?.type;
  return (await markPaid(b.id, { provider: "stripe", ref: session.id, method })) ?? b;
}

async function markOnePaid(bookingId: string, ref: { provider: string; ref?: string; method?: string }) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b || (b.status !== "PENDING" && b.status !== "EXPIRED")) return b;

  const paidData = { paymentProvider: ref.provider, paymentRef: ref.ref ?? b.paymentRef, paymentMethod: ref.method ?? null, paidAt: new Date() };
  // Zmiana statusu tylko z PENDING/EXPIRED: gdy Stripe wyśle to samo powiadomienie dwa razy naraz,
  // tylko jedno przejdzie, więc klient dostanie jeden mail i jeden SMS.
  const claimable = { id: b.id, status: { in: ["PENDING", "EXPIRED"] } };
  let claimed: number;
  try {
    ({ count: claimed } = await prisma.booking.updateMany({ where: claimable, data: { ...paidData, status: "PAID", holdExpiresAt: null } }));
  } catch (e) {
    if (!isOverlapError(e)) throw e;
    // Zapłacił po wygaśnięciu blokady, a termin w międzyczasie kupił ktoś inny: pełny zwrot.
    const { count } = await prisma.booking.updateMany({
      where: claimable,
      data: { ...paidData, status: "REFUNDED", refundAmount: b.priceGross, cancelledAt: new Date() },
    });
    const updated = await prisma.booking.findUniqueOrThrow({ where: { id: b.id } });
    if (count === 1) {
      await refund(updated, updated.priceGross);
      const m = cancelledEmail(updated, updated.priceGross, "conflict");
      await sendEmail({ to: updated.email, ...m, bookingId: updated.id });
    }
    return updated;
  }
  const updated = await prisma.booking.findUniqueOrThrow({ where: { id: b.id } });
  if (claimed !== 1) return updated;
  if (updated.discountCode) await prisma.discountCode.update({ where: { code: updated.discountCode }, data: { uses: { increment: 1 } } }).catch(() => null);
  await afterPaid(updated);
  return updated;
}

async function afterPaid(b: Booking) {
  const m = confirmationEmail(b);
  await sendEmail({ to: b.email, subject: m.subject, html: m.html, text: m.text, bookingId: b.id });
  if (smsLead(b)) await sendSms(b.phone, confirmationSms(b), b.id);
  // Rezerwacja zrobiona w ciągu 24 h: przypomnienie 24 h nie ma sensu.
  if (b.start.getTime() - Date.now() < 24 * 60 * MIN) await prisma.booking.update({ where: { id: b.id }, data: { remind24At: new Date(0) } });
  const staff = process.env.STAFF_NOTIFY_EMAIL;
  if (staff) {
    const s = staffEmail(b);
    await sendEmail({ to: staff, ...s, bookingId: b.id });
  }
}

/** Ile zwrócić, gdy klient odwołuje teraz. */
export function refundPolicy(b: Booking, now = new Date()) {
  const hoursLeft = (b.start.getTime() - now.getTime()) / 3_600_000;
  return {
    canCancel: b.status === "PAID" && hoursLeft >= BOOKING.freeCancelHours,
    canReschedule: b.status === "PAID" && hoursLeft >= BOOKING.rescheduleHours,
    refund: hoursLeft >= BOOKING.freeCancelHours ? b.priceGross : 0,
  };
}

export async function cancelBooking(id: string, by: "customer" | "admin", refundOverride?: number) {
  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b) throw new BookingError("invalid");
  if (b.status === "PENDING") {
    if (b.paymentRef) await expireCheckout(b.paymentRef);
    return prisma.booking.update({ where: { id }, data: { status: "CANCELLED", cancelledAt: new Date() } });
  }
  const policy = refundPolicy(b);
  if (by === "customer" && !policy.canCancel) throw new BookingError("not_allowed");
  if (b.status !== "PAID") throw new BookingError("not_allowed");
  const amount = by === "admin" ? Math.min(refundOverride ?? b.priceGross, b.priceGross) : policy.refund;
  await refund(b, amount);
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: amount > 0 ? "REFUNDED" : "CANCELLED", refundAmount: amount, cancelledAt: new Date() },
  });
  const m = cancelledEmail(updated, amount, by === "admin" ? "admin" : "customer");
  await sendEmail({ to: updated.email, ...m, bookingId: updated.id });
  return updated;
}

export async function rescheduleBooking(id: string, newStart: Date, newSimId: string | null, by: "customer" | "admin") {
  const b = await prisma.booking.findUnique({ where: { id } });
  if (!b) throw new BookingError("invalid");
  if (by === "customer" && !refundPolicy(b).canReschedule) throw new BookingError("not_allowed");
  if (!validStart(newStart, b.durationMin, new Date(), by === "admin")) throw new BookingError("closed");
  const simulatorId = newSimId ?? b.simulatorId;
  const sim = simById(simulatorId);
  if (!sim || sim.status !== "ACTIVE") throw new BookingError("invalid");
  // Zmiana na droższe stanowisko wymagałaby dopłaty – klient może wybrać tylko tę samą grupę cenową.
  if (by === "customer" && sim.priceGroup !== simById(b.simulatorId)?.priceGroup) throw new BookingError("not_allowed");
  const end = new Date(newStart.getTime() + b.durationMin * MIN);
  const updated = await prisma.$transaction(async (tx) => {
    await releaseStaleHolds(tx, [simulatorId], newStart, end);
    if (!(await isFree(tx, simulatorId, newStart, end, b.id))) throw new BookingError("slot_taken");
    return tx.booking.update({
      where: { id },
      data: {
        start: newStart,
        end,
        simulatorId,
        remind24At: newStart.getTime() - Date.now() < 24 * 60 * MIN ? new Date(0) : null,
        remind10At: null,
      },
    });
  }).catch((e) => {
    if (isOverlapError(e)) throw new BookingError("slot_taken");
    throw e;
  });
  const m = rescheduledEmail(updated);
  await sendEmail({ to: updated.email, ...m, bookingId: updated.id });
  return updated;
}

export const contactLine = () => SITE.phone ?? SITE.email;
