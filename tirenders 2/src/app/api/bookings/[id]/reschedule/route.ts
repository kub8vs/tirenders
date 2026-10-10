import { NextResponse } from "next/server";
import { z } from "zod";
import { canManage } from "@/lib/access";
import { BookingError, rescheduleBooking } from "@/lib/bookings";
import { prisma } from "@/lib/db";

const Body = z.object({ start: z.string().datetime(), simulatorId: z.string().max(40).optional(), s: z.string().optional() });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const b = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!b || !(await canManage(b, parsed.data.s))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const u = await rescheduleBooking(b.id, new Date(parsed.data.start), parsed.data.simulatorId ?? null, "customer");
    return NextResponse.json({ ok: true, start: u.start, simulatorId: u.simulatorId });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    throw e;
  }
}
