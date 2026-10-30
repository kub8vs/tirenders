import { NextResponse } from "next/server";
import { z } from "zod";
import { BOOKING } from "@/config/site";
import { audit } from "@/lib/audit";
import { canSee, staffUser } from "@/lib/auth";
import { BookingError, cancelBooking, createBooking, rescheduleBooking } from "@/lib/bookings";
import { sendEmail, sendSms } from "@/lib/notify";
import { payLinkEmail, payLinkSms } from "@/lib/templates";
import { warsaw } from "@/lib/time";
import { payUrl } from "@/lib/tokens";

const Create = z.object({
  action: z.literal("create"),
  simulatorIds: z.array(z.string()).min(1),
  // dzień i godzina w czasie warszawskim (serwer sam liczy strefę i zmianę czasu)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  durationMin: z.number().int().refine((d) => BOOKING.durations.includes(d as never)),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,18}$/),
});
const Cancel = z.object({ action: z.literal("cancel"), id: z.string(), refund: z.number().int().min(0).optional() });
const Move = z.object({ action: z.literal("move"), id: z.string(), start: z.string().datetime(), simulatorId: z.string().optional() });

export async function POST(req: Request) {
  const me = await staffUser("calendar");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  try {
    if (body?.action === "create") {
      const d = Create.parse(body);
      // Rezerwacja telefoniczna, płatność tylko przez stronę: wszystkie stanowiska jako jedna grupa i jedna płatność.
      // Termin jest zablokowany od razu; jeśli klient nie zapłaci w czasie, wraca do sprzedaży.
      const { bookings } = await createBooking({ simulatorIds: d.simulatorIds, start: warsaw(d.date, d.time), durationMin: d.durationMin, firstName: d.firstName, lastName: d.lastName, email: d.email, phone: d.phone, locale: "pl", source: "ADMIN", payLink: true });
      const lead = bookings[0];
      await audit(me.email, "Rezerwacja telefoniczna", { bookingId: lead.id, details: `${bookings.map((x) => x.code).join(", ")} ${lead.name}` });
      await sendSms(lead.phone, payLinkSms(bookings), lead.id);
      await sendEmail({ to: lead.email, ...payLinkEmail(bookings), bookingId: lead.id });
      return NextResponse.json({ ok: true, codes: bookings.map((b) => b.code), payUrl: payUrl(lead.code), holdExpiresAt: lead.holdExpiresAt });
    }
    if (body?.action === "cancel") {
      const d = Cancel.parse(body);
      // Odwołanie ze zwrotem pieniędzy tylko właściciel.
      if (!canSee(me, "refunds")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const b = await cancelBooking(d.id, "admin", d.refund);
      await audit(me.email, "Odwołanie i zwrot", { bookingId: b.id, details: `${b.code} ${b.name}, zwrot ${(b.refundAmount / 100).toFixed(2)} zł` });
      return NextResponse.json({ ok: true, status: b.status });
    }
    if (body?.action === "move") {
      const d = Move.parse(body);
      const b = await rescheduleBooking(d.id, new Date(d.start), d.simulatorId ?? null, "admin");
      await audit(me.email, "Przeniesienie rezerwacji", { bookingId: b.id, details: `${b.code} na ${b.start.toISOString()}` });
      return NextResponse.json({ ok: true, start: b.start });
    }
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    throw e;
  }
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
