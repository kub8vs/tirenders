import { NextResponse } from "next/server";
import { z } from "zod";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({ name: z.string().trim().min(2).max(120), phone: z.string().trim().max(20).optional(), locale: z.enum(["pl", "en"]).optional() });

export async function PATCH(req: Request) {
  const u = await currentUser();
  if (!u) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.user.update({ where: { id: u.id }, data: { name: p.data.name, phone: p.data.phone || null, locale: p.data.locale ?? u.locale } });
  return NextResponse.json({ ok: true });
}
