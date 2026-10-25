import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Dla monitoringu (Better Stack sprawdza co minutę): 200 = strona i baza działają, 503 = baza nie odpowiada.
export async function GET() {
  const t0 = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, db: "ok", ms: Date.now() - t0, ...(await configCheck()) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, db: "down" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

// Na kopii testowej pokazuje, które ustawienia są wpisane (tylko tak/nie, nigdy wartości).
async function configCheck() {
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
    stripe: await stripeInfo(),
  };
}

// Które konto Stripe jest podpięte i czy to tryb testowy (bez kluczy, tylko id i nazwa konta).
async function stripeInfo() {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const s = stripe();
  if (!s) return null;
  const acct = await s.accounts.retrieve().catch(() => null);
  return {
    tryb: key.includes("_live_") ? "PRAWDZIWE PŁATNOŚCI" : key.includes("_test_") ? "testowy" : "nieznany",
    konto: acct?.id ?? "brak dostępu",
    nazwa: acct?.settings?.dashboard?.display_name || acct?.business_profile?.name || null,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  };
}
