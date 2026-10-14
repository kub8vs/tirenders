import { NextResponse } from "next/server";
import { BOOKING, simById } from "@/config/site";
import { quote } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const sims = (u.searchParams.get("sims") ?? u.searchParams.get("sim") ?? "").split(",").filter(Boolean);
  const duration = Number(u.searchParams.get("duration"));
  const code = u.searchParams.get("code");
  if (!sims.length || sims.length > 10 || new Set(sims).size !== sims.length || sims.some((s) => !simById(s)) || !BOOKING.durations.includes(duration as never))
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  const q = await quote(sims, duration, code);
  return NextResponse.json({ ...q, codeValid: code ? !!q.code : null });
}
