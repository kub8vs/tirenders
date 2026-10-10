import type { Booking } from "@prisma/client";
import { BOOKING, SITE, simById } from "@/config/site";
import { isFree, validStart } from "./availability";
import { prisma } from "./db";
import { sendEmail, sendSms } from "./notify";
import { createCheckout, expireCheckout, refund } from "./payments";
import { quote } from "./pricing";
import { cancelledEmail, confirmationEmail, confirmationSms, rescheduledEmail, staffEmail } from "./templates";
import { MIN } from "./time";
import { bookingCode } from "./tokens";

export class BookingError extends Error {
  constructor(public code: "slot_taken" | "invalid" | "closed" | "not_allowed") {
    super(code);
  }
}

export type NewBooking = {
  simulatorId: string;
  start: Date;
  durationMin: number;
  name: string;
  email: string;
  phone: string;
  discountCode?: string | null;
  userId?: string | null;
  locale: string;
  source?: "ONLINE" | "ADMIN";
  note?: string;
  markPaid?: boolean; // tylko panel obsługi
};

export async function createBooking(input: NewBooking) {
  const sim = simById(input.simulatorId);
  if (!sim || sim.status !== "ACTIVE") throw new BookingError("invalid");
  const admin = input.source === "ADMIN";
  if (!validStart(input.start, input.durationMin, new Date(), admin)) throw new BookingError("closed");
  const end = new Date(input.start.getTime() + input.durationMin * MIN);
  const q = await quote(sim.id, input.durationMin, input.discountCode);

  const booking = await prisma.$transaction(async (tx) => {
    if (!(await isFree(tx, sim.id, input.start, end))) throw new BookingError("slot_taken");
    let code = bookingCode();
    while (await tx.booking.findUnique({ where: { code } })) code = bookingCode();
    return tx.booking.create({
      data: {
        code,
        simulatorId: sim.id,
        userId: input.userId ?? null,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone.trim(),
        start: input.start,
        end,
        durationMin: input.durationMin,
        listPriceGross: q.list,
        discountAmount: q.discount,
        discountCode: q.code,
        priceGross: q.total,
        status: input.markPaid ? "PAID" : "PENDING",
        paidAt: input.markPaid ? new Date() : null,
        paymentProvider: input.markPaid ? "onsite" : null,
        paymentMethod: input.markPaid ? "ONSITE" : null,
        holdExpiresAt: input.markPaid ? null : new Date(Date.now() + BOOKING.holdMin * MIN),
        source: input.source ?? "ONLINE",
        note: input.note,
        locale: input.locale === "en" ? "en" : "pl",
      },
    });
  });

  if (input.markPaid) {
    await afterPaid(booking);
    return { booking, checkoutUrl: null };
  }
  const checkoutUrl = await createCheckout(booking);
  return { booking, checkoutUrl };
}

/** Wywoływane przez webhook Stripe albo bramkę testową. Idempotentne. */
export async function markPaid(bookingId: string, ref: { provider: string; ref?: string; method?: string }) {
  const b = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!b || b.status === "PAID" || b.status === "COMPLETED") return b;
  if (b.status !== "PENDING" && b.status !== "EXPIRED") return b;

  const stillFree = await isFree(prisma, b.simulatorId, b.start, b.end, b.id);
  const paidData = { paymentProvider: ref.provider, paymentRef: ref.ref ?? b.paymentRef, paymentMethod: ref.method ?? null, paidAt: new Date() };
  if (!stillFree) {
    const updated = await prisma.booking.update({ where: { id: b.id }, data: { ...paidData, status: "REFUNDED", refundAmount: b.priceGross, cancelledAt: new Date() } });
    await refund(updated, updated.priceGross);
    const m = cancelledEmail(updated, updated.priceGross, "conflict");
    await sendEmail({ to: updated.email, ...m, bookingId: updated.id });
    return updated;
  }
  const updated = await prisma.booking.update({ where: { id: b.id }, data: { ...paidData, status: "PAID", holdExpiresAt: null } });
  if (updated.discountCode) await prisma.discountCode.update({ where: { code: updated.discountCode }, data: { uses: { increment: 1 } } }).catch(() => null);
  await afterPaid(updated);
  return updated;
}

async function afterPaid(b: Booking) {
  const m = confirmationEmail(b);
  await sendEmail({ to: b.email, subject: m.subject, html: m.html, text: m.text, bookingId: b.id });
  await sendSms(b.phone, confirmationSms(b), b.id);
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
  });
  const m = rescheduledEmail(updated);
  await sendEmail({ to: updated.email, ...m, bookingId: updated.id });
  return updated;
}

export const contactLine = () => SITE.phone ?? SITE.email;
