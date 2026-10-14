import { NextResponse } from "next/server";
import { z } from "zod";
import { BOOKING } from "@/config/site";
import { currentUser } from "@/lib/auth";
import { BookingError, createBooking } from "@/lib/bookings";
import { prisma } from "@/lib/db";

const Body = z.object({
  simulatorId: z.string().max(40).optional(),
  simulatorIds: z.array(z.string().max(40)).min(1).max(10).optional(),
  start: z.string().datetime(),
  durationMin: z.number().int().refine((d) => BOOKING.durations.includes(d as never)),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().regex(/^[+\d][\d\s-]{8,18}$/),
  discountCode: z.string().max(40).optional().nullable(),
  terms: z.literal(true),
  lang: z.enum(["pl", "en"]).default("pl"),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 });
  const d = parsed.data;
  const simulatorIds = d.simulatorIds ?? (d.simulatorId ? [d.simulatorId] : []);
  if (!simulatorIds.length) return NextResponse.json({ error: "invalid" }, { status: 400 });

  // prosta ochrona przed zalewem: max 3 nieopłacone holdy na e-mail
  const holds = await prisma.booking.count({ where: { email: d.email.toLowerCase(), status: "PENDING", holdExpiresAt: { gt: new Date() } } });
  if (holds >= 3) return NextResponse.json({ error: "too_many_holds" }, { status: 429 });

  const user = await currentUser();
  try {
    const { booking, checkoutUrl } = await createBooking({
      simulatorIds,
      start: new Date(d.start),
      durationMin: d.durationMin,
      name: d.name,
      email: d.email,
      phone: d.phone,
      discountCode: d.discountCode,
      userId: user?.id,
      locale: d.lang,
    });
    return NextResponse.json({ id: booking.id, code: booking.code, holdExpiresAt: booking.holdExpiresAt, checkoutUrl });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
