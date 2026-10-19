import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { allow, clientIp } from "@/lib/ratelimit";

const Body = z.object({
  email: z.string().email().max(160),
  password: z.string().min(8).max(200),
  name: z.string().min(2).max(120),
  phone: z.string().min(9).max(20).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  if (!(await allow(`register:ip:${clientIp(req)}`, 10, 600))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) return NextResponse.json({ error: "exists" }, { status: 409 });
  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, name: existing?.name ?? parsed.data.name, phone: existing?.phone ?? (parsed.data.phone || null) },
    create: { email, passwordHash, name: parsed.data.name, phone: parsed.data.phone || null },
  });
  return NextResponse.json({ ok: true });
}
