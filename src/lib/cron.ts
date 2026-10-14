import { prisma } from "./db";
import { sendEmail, sendSms } from "./notify";
import { smsLead } from "./bookings";
import { expireCheckout } from "./payments";
import { reminder10, reminder24, reviewEmail } from "./templates";
import { MIN } from "./time";

/** Uruchamiane co minutę (Vercel Cron lub zewnętrzny ping). */
export async function tick(now = new Date()) {
  const out = { expired: 0, r24: 0, r10: 0, reviews: 0, completed: 0 };

  // 1. Nieopłacone holdy po 10 min wracają do puli.
  const stale = await prisma.booking.findMany({ where: { status: "PENDING", holdExpiresAt: { lt: now } } });
  for (const b of stale) {
    await prisma.booking.update({ where: { id: b.id }, data: { status: "EXPIRED" } });
    if (b.paymentRef) await expireCheckout(b.paymentRef);
    out.expired++;
  }

  // 2. Przypomnienie 24 h przed (mail + SMS).
  const due24 = await prisma.booking.findMany({
    where: { status: "PAID", remind24At: null, start: { lte: new Date(now.getTime() + 24 * 60 * MIN), gt: new Date(now.getTime() + 60 * MIN) } },
  });
  for (const b of due24) {
    const r = reminder24(b);
    await prisma.booking.update({ where: { id: b.id }, data: { remind24At: now } });
    await sendEmail({ to: b.email, ...r.email, bookingId: b.id });
    if (smsLead(b)) await sendSms(b.phone, r.sms, b.id);
    out.r24++;
  }

  // 3. 10 min przed (mail + SMS).
  const due10 = await prisma.booking.findMany({
    where: { status: "PAID", remind10At: null, start: { lte: new Date(now.getTime() + 10 * MIN), gt: new Date(now.getTime() - 5 * MIN) } },
  });
  for (const b of due10) {
    const r = reminder10(b);
    await prisma.booking.update({ where: { id: b.id }, data: { remind10At: now } });
    await sendEmail({ to: b.email, ...r.email, bookingId: b.id });
    if (smsLead(b)) await sendSms(b.phone, r.sms, b.id);
    out.r10++;
  }

  // 4. Po sesji: status + prośba o opinię (godzinę po końcu, tylko dla tych, co przyszli).
  const finished = await prisma.booking.findMany({ where: { status: "PAID", end: { lt: now } } });
  for (const b of finished) {
    await prisma.booking.update({ where: { id: b.id }, data: { status: b.checkedInAt ? "COMPLETED" : "NO_SHOW" } });
    out.completed++;
  }
  const reviews = await prisma.booking.findMany({ where: { status: "COMPLETED", reviewAt: null, end: { lt: new Date(now.getTime() - 60 * MIN) } } });
  for (const b of reviews) {
    await prisma.booking.update({ where: { id: b.id }, data: { reviewAt: now } });
    await sendEmail({ to: b.email, ...reviewEmail(b), bookingId: b.id });
    out.reviews++;
  }
  return out;
}

export function cronAuthorized(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}
