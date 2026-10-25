import { NextResponse } from "next/server";
import { z } from "zod";
import { BOOKING, activeSims } from "@/config/site";
import { currentUser } from "@/lib/auth";
import { BookingError, createBooking, isBusyError } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { alarm } from "@/lib/alarm";
import { allow, clientIp } from "@/lib/ratelimit";

const Body = z.object({
  simulatorId: z.string().max(40).optional(),
  simulatorIds: z.array(z.string().max(40)).min(1).max(10).optional(),
  start: z.string().datetime(),
  durationMin: z.number().int().refine((d) => BOOKING.durations.includes(d as never)),
  firstName: z.string().trim().min(2).max(60),
  lastName: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,18}$/),
  discountCode: z.string().max(40).optional().nullable(),
  terms: z.literal(true),
  lang: z.enum(["pl", "en"]).default("pl"),
});

export async function POST(req: Request) {
  try {
    return await handle(req);
  } catch (e) {
    if (isBusyError(e)) return NextResponse.json({ error: "busy" }, { status: 503, headers: { "Retry-After": "2" } });
    await alarm("rezerwacja online", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

async function handle(req: Request) {
  // Limit na adres IP jest luźny, bo goście w salonie mogą dzielić jedno Wi-Fi.
  if (!(await allow(`book:ip:${clientIp(req)}`, 30, 60))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const simulatorIds = d.simulatorIds ?? (d.simulatorId ? [d.simulatorId] : []);
  if (!simulatorIds.length) return NextResponse.json({ error: "invalid" }, { status: 400 });
  // Cały salon na wyłączność rezerwuje tylko obsługa (telefonicznie), także dla zalogowanych klientów.
  if (new Set(simulatorIds).size >= activeSims().length) return NextResponse.json({ error: "whole_salon" }, { status: 403 });

  // jeden numer telefonu: max 6 prób na 10 min (bot nie zablokuje całego dnia, zmieniając tylko e-mail)
  if (!(await allow(`book:phone:${d.phone.replace(/\D/g, "")}`, 6, 600))) return NextResponse.json({ error: "rate" }, { status: 429 });
  // prosta ochrona przed zalewem: max 3 nieopłacone holdy na e-mail
  const holds = await prisma.booking.count({ where: { email: d.email.toLowerCase(), status: "PENDING", holdExpiresAt: { gt: new Date() } } });
  if (holds >= 3) return NextResponse.json({ error: "too_many_holds" }, { status: 429 });

  const user = await currentUser();
  try {
    const { booking, checkoutUrl } = await createBooking({
      simulatorIds,
      start: new Date(d.start),
      durationMin: d.durationMin,
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone,
      discountCode: d.discountCode,
      userId: user?.id,
      locale: d.lang,
    });
    return NextResponse.json({ id: booking.id, code: booking.code, holdExpiresAt: booking.holdExpiresAt, checkoutUrl });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    throw e;
  }
}
