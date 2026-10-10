import { NextResponse } from "next/server";
import { BOOKING, simById } from "@/config/site";
import { quote } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sim = u.searchParams.get("sim") ?? "";
  const duration = Number(u.searchParams.get("duration"));
  const code = u.searchParams.get("code");
  if (!simById(sim) || !BOOKING.durations.includes(duration as never)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const q = await quote(sim, duration, code);
  return NextResponse.json({ ...q, codeValid: code ? !!q.code : null });
}
