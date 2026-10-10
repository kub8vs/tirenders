import { NextResponse } from "next/server";
import { z } from "zod";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({ product: z.string().min(2).max(120), category: z.enum(["MERCH", "WHEEL", "OTHER"]), qty: z.number().int().min(1).max(99), amount: z.number().min(0.01), method: z.enum(["CASH", "CARD", "BLIK"]) });

export async function POST(req: Request) {
  const u = await staffUser("sales");
  if (!u) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const s = await prisma.sale.create({ data: { ...p.data, amount: Math.round(p.data.amount * 100), createdBy: u.email } });
  return NextResponse.json({ ok: true, id: s.id });
}

export async function DELETE(req: Request) {
  if (!(await staffUser("codes"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const id = new URL(req.url).searchParams.get("id");
  if (id) await prisma.sale.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
