import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("note"), id: z.string(), note: z.string().max(500) }),
  z.object({ action: z.literal("forget"), id: z.string() }),
]);

// RODO: eksport wszystkich danych gościa w JSON.
export async function GET(req: Request) {
  const me = await staffUser("customers");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("export") ?? "";
  const c = await prisma.customer.findUnique({ where: { id }, include: { bookings: true } });
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  await audit(me.email, "Eksport danych gościa (RODO)", { details: c.email });
  return new NextResponse(JSON.stringify(c, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="dane-${c.lastName || "gosc"}.json"` },
  });
}

export async function POST(req: Request) {
  const me = await staffUser("customers");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const c = await prisma.customer.findUnique({ where: { id: p.data.id } });
  if (!c) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (p.data.action === "note") {
    await prisma.customer.update({ where: { id: c.id }, data: { note: p.data.note || null } });
    return NextResponse.json({ ok: true });
  }
  // Prawo do bycia zapomnianym: kwoty zostają w księgowości, dane osobowe znikają.
  const upcoming = await prisma.booking.count({ where: { customerId: c.id, status: { in: ["PAID", "PENDING"] }, end: { gt: new Date() } } });
  if (upcoming) return NextResponse.json({ error: "upcoming" }, { status: 409 });
  await prisma.$transaction([
    prisma.booking.updateMany({ where: { OR: [{ customerId: c.id }, { email: c.email }] }, data: { name: "Usunięto (RODO)", firstName: null, lastName: null, email: `usunieto-${c.id}@rodo.invalid`, phone: "-", customerId: null } }),
    prisma.customer.delete({ where: { id: c.id } }),
  ]);
  await audit(me.email, "Usunięcie danych gościa (RODO)", { details: `${c.firstName} ${c.lastName.slice(0, 1)}.` });
  return NextResponse.json({ ok: true });
}
