import { NextResponse } from "next/server";
import { z } from "zod";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({ email: z.string().email(), role: z.enum(["CUSTOMER", "STAFF", "ACCOUNTING", "OWNER"]) });

// Nadawanie ról obsłudze. Osoba musi mieć konto (może je założyć sama albo przez link na e-mail).
export async function POST(req: Request) {
  const me = await staffUser("users");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = p.data.email.toLowerCase();
  if (email === me.email && p.data.role !== "OWNER") return NextResponse.json({ error: "self" }, { status: 400 });
  const u = await prisma.user.upsert({ where: { email }, update: { role: p.data.role }, create: { email, role: p.data.role } });
  return NextResponse.json({ ok: true, id: u.id });
}
