import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// Dla monitoringu (Better Stack sprawdza co minutę): 200 = strona i baza działają, 503 = baza nie odpowiada.
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok", ms: Date.now() - t0, ...configCheck() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

// Na kopii testowej pokazuje, które ustawienia są wpisane (tylko tak/nie, nigdy wartości).
function configCheck() {
  if (process.env.VERCEL_ENV === "production") return {};
  const has = (k: string) => !!process.env[k];
  return {
    config: {
      baza: has("DATABASE_URL") && has("DATABASE_URL_UNPOOLED"),
      ochronaPrzedBotami: has("KV_REST_API_URL") && has("KV_REST_API_TOKEN"),
      maile: has("RESEND_API_KEY"),
      wlasciciel: has("OWNER_EMAILS"),
      sekretLogowania: has("AUTH_SECRET"),
      platnosciStripe: has("STRIPE_SECRET_KEY") && has("STRIPE_WEBHOOK_SECRET"),
      sms: has("SMSAPI_TOKEN"),
    },
  };
}
