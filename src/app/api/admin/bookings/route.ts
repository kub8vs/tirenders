import { NextResponse } from "next/server";
import { z } from "zod";
import { BOOKING } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { BookingError, cancelBooking, createBooking, rescheduleBooking } from "@/lib/bookings";

const Create = z.object({
  action: z.literal("create"),
  simulatorIds: z.array(z.string()).min(1),
  start: z.string().datetime(),
  durationMin: z.number().int().refine((d) => BOOKING.durations.includes(d as never)),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(9),
  note: z.string().max(500).optional(),
});
const Cancel = z.object({ action: z.literal("cancel"), id: z.string(), refund: z.number().int().min(0).optional() });
const Move = z.object({ action: z.literal("move"), id: z.string(), start: z.string().datetime(), simulatorId: z.string().optional() });

export async function POST(req: Request) {
  if (!(await staffUser("calendar"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);
  try {
    if (body?.action === "create") {
      const d = Create.parse(body);
      // Rezerwacja telefoniczna: od razu opłacona (płatność na miejscu). Kilka stanowisk = wyłączność.
      const created = [];
      for (const simulatorId of d.simulatorIds) {
        const { booking } = await createBooking({ simulatorId, start: new Date(d.start), durationMin: d.durationMin, name: d.name, email: d.email, phone: d.phone, note: d.note, locale: "pl", source: "ADMIN", markPaid: true });
        created.push(booking.code);
      }
      return NextResponse.json({ ok: true, codes: created });
    }
    if (body?.action === "cancel") {
      const d = Cancel.parse(body);
      const b = await cancelBooking(d.id, "admin", d.refund);
      return NextResponse.json({ ok: true, status: b.status });
    }
    if (body?.action === "move") {
      const d = Move.parse(body);
      const b = await rescheduleBooking(d.id, new Date(d.start), d.simulatorId ?? null, "admin");
      return NextResponse.json({ ok: true, start: b.start });
    }
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    if (e instanceof z.ZodError) return NextResponse.json({ error: "invalid" }, { status: 400 });
    throw e;
  }
  return NextResponse.json({ error: "invalid" }, { status: 400 });
}
