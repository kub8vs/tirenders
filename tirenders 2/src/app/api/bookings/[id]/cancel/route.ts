import { NextResponse } from "next/server";
import { canManage } from "@/lib/access";
import { BookingError, cancelBooking } from "@/lib/bookings";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const body = (await req.json().catch(() => ({}))) as { s?: string };
  const b = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!b || !(await canManage(b, body.s))) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const u = await cancelBooking(b.id, "customer");
    return NextResponse.json({ ok: true, status: u.status, refund: u.refundAmount });
  } catch (e) {
    if (e instanceof BookingError) return NextResponse.json({ error: e.code }, { status: 409 });
    throw e;
  }
}
