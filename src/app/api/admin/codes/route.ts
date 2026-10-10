import { NextResponse } from "next/server";
import { z } from "zod";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

const Body = z.object({
  code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/),
  percent: z.number().int().min(1).max(100).optional(),
  amountOff: z.number().min(1).optional(),
  maxUses: z.number().int().min(1).optional(),
  validTo: z.string().optional(),
});

export async function POST(req: Request) {
  if (!(await staffUser("codes"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success || (!p.data.percent && !p.data.amountOff)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = p.data;
  const code = d.code.toUpperCase();
  await prisma.discountCode.upsert({
    where: { code },
    update: { percent: d.percent ?? null, amountOff: d.amountOff ? Math.round(d.amountOff * 100) : null, maxUses: d.maxUses ?? null, validTo: d.validTo ? new Date(d.validTo + "T23:59:59") : null, active: true },
    create: { code, percent: d.percent ?? null, amountOff: d.amountOff ? Math.round(d.amountOff * 100) : null, maxUses: d.maxUses ?? null, validTo: d.validTo ? new Date(d.validTo + "T23:59:59") : null },
  });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  if (!(await staffUser("codes"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { code, active } = (await req.json().catch(() => ({}))) as { code?: string; active?: boolean };
  if (!code) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await prisma.discountCode.update({ where: { code }, data: { active: !!active } });
  return NextResponse.json({ ok: true });
}
