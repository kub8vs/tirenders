import { NextResponse } from "next/server";
import { simById } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtLong } from "@/lib/time";

export async function POST(req: Request) {
  if (!(await staffUser("checkin"))) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { code } = (await req.json().catch(() => ({}))) as { code?: string };
  const clean = (code ?? "").toUpperCase().replace(/^TIRENDERS:/, "").replace(/[^A-Z0-9]/g, "");
  const b = await prisma.booking.findUnique({ where: { code: clean } });
  if (!b) return NextResponse.json({ result: "not_found" });
  const info = { code: b.code, name: b.name, sim: simById(b.simulatorId)?.name, when: fmtLong(b.start, "pl"), duration: b.durationMin };
  if (!["PAID", "COMPLETED", "NO_SHOW"].includes(b.status)) return NextResponse.json({ result: "not_paid", status: b.status, ...info });
  const now = Date.now();
  if (b.start.getTime() - now > 2 * 3600_000) return NextResponse.json({ result: "too_early", ...info });
  if (b.checkedInAt) return NextResponse.json({ result: "already", at: b.checkedInAt, ...info });
  await prisma.booking.update({ where: { id: b.id }, data: { checkedInAt: new Date(), status: b.status === "NO_SHOW" ? "COMPLETED" : b.status } });
  return NextResponse.json({ result: "ok", ...info });
}
