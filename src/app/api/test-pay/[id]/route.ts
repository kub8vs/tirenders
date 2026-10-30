import { NextResponse } from "next/server";
import { markPaid } from "@/lib/bookings";
import { testPayAllowed } from "@/lib/payments";

// Lokalna bramka testowa. Wyłączona, gdy skonfigurowano Stripe albo na produkcji.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!testPayAllowed()) return NextResponse.json({ error: "disabled" }, { status: 404 });
  const { method } = (await req.json().catch(() => ({}))) as { method?: string };
  const b = await markPaid(params.id, { provider: "test", ref: "test_" + params.id, method: method || "blik" });
  return NextResponse.json({ status: b?.status });
}
