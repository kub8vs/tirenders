import Link from "next/link";
import { redirect } from "next/navigation";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/payments";
import { analyticsReady } from "@/lib/vercelAnalytics";

export const dynamic = "force-dynamic";

export default async function Page() {
  if (!(await staffUser("tech"))) redirect("/panel");
  const has = (k: string) => !!process.env[k];
  const t0 = Date.now();
  const db = await prisma.$queryRaw`SELECT 1`.then(() => Date.now() - t0).catch(() => null);
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  const acct = stripe() ? await stripe()!.accounts.retrieve().catch(() => null) : null;
  const failed = await prisma.notificationLog.count({ where: { status: "FAILED", createdAt: { gt: new Date(Date.now() - 7 * 86_400_000) } } });
  const checks: [string, boolean, string][] = [
    ["Baza danych", db !== null, db !== null ? `odpowiada w ${db} ms` : "NIE ODPOWIADA"],
    ["Maile (Resend)", has("RESEND_API_KEY"), has("RESEND_API_KEY") ? "klucz wpisany" : "brak klucza"],
    ["SMS (SMSAPI)", has("SMSAPI_TOKEN"), has("SMSAPI_TOKEN") ? "token wpisany" : "brak tokenu, SMS-y nie wychodzą"],
    ["Płatności Stripe", !!acct, acct ? `${key.includes("_live_") ? "PRAWDZIWE PŁATNOŚCI" : "tryb testowy"} · ${acct.settings?.dashboard?.display_name || acct.id}` : "brak połączenia"],
    ["Webhook Stripe", has("STRIPE_WEBHOOK_SECRET"), has("STRIPE_WEBHOOK_SECRET") ? "ustawiony" : "brak (płatność potwierdza strona sukcesu)"],
    ["Ochrona przed botami (Redis)", has("KV_REST_API_URL"), has("KV_REST_API_URL") ? "działa" : "liczniki tylko w pamięci"],
    ["Zadania automatyczne (cron)", has("CRON_SECRET"), has("CRON_SECRET") ? "zabezpieczone hasłem" : "brak CRON_SECRET"],
    ["Odwiedziny w panelu", analyticsReady(), analyticsReady() ? "token Vercel wpisany" : "brak VERCEL_API_TOKEN"],
    ["Raport dzienny mailem", has("REPORT_EMAILS"), process.env.REPORT_EMAILS ?? "brak adresów"],
  ];
  return (
    <>
      <h1>Technika</h1>
      <p className="muted" style={{ marginBottom: 16 }}>Widzisz to tylko Ty. Wartości kluczy nigdy się tu nie pokazują.</p>
      <div className="tbl">
        <table>
          <tbody>
            {checks.map(([k, ok, info]) => (
              <tr key={k}><th style={{ textTransform: "none", letterSpacing: 0, fontSize: 14, color: "#fff" }}>{k}</th><td><span className={`pill ${ok ? "PAID" : "PENDING"}`}>{ok ? "OK" : "Uwaga"}</span></td><td className="muted">{info}</td></tr>
            ))}
            <tr><th style={{ textTransform: "none", letterSpacing: 0, fontSize: 14, color: "#fff" }}>Nieudane maile/SMS (7 dni)</th><td><span className={`pill ${failed ? "CANCELLED" : "PAID"}`}>{failed}</span></td><td><Link href="/panel/powiadomienia" style={{ textDecoration: "underline" }}>Wszystkie powiadomienia</Link></td></tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
