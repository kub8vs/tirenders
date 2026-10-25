import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { PANEL_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({ token: z.string().min(10).max(100), password: z.string().min(10).max(200) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const t = await prisma.magicToken.findUnique({ where: { token: p.data.token } });
  if (!t || t.purpose !== "password" || t.usedAt || t.expiresAt < new Date()) return NextResponse.json({ error: "expired" }, { status: 410 });
  const u = await prisma.user.findUnique({ where: { email: t.email } });
  if (!u || !(PANEL_ROLES as readonly string[]).includes(u.role)) return NextResponse.json({ error: "expired" }, { status: 410 });
  // Token zużywamy warunkowo, żeby dwa kliknięcia naraz nie ustawiły hasła dwa razy.
  const used = await prisma.magicToken.updateMany({ where: { token: t.token, usedAt: null }, data: { usedAt: new Date() } });
  if (!used.count) return NextResponse.json({ error: "expired" }, { status: 410 });
  await prisma.user.update({ where: { id: u.id }, data: { passwordHash: await bcrypt.hash(p.data.password, 12) } });
  await audit(u.email, "Ustawienie hasła do panelu");
  return NextResponse.json({ ok: true });
}
