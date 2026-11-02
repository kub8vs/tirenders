import { createHash } from "node:crypto";
import type { Booking } from "@prisma/client";
import { simById } from "@/config/site";
import { appUrl } from "./templates";

// Płatności przez Tpay (konto klienta). Klient wybiera na naszej stronie BLIK, kartę, Google Pay albo Apple Pay,
// a płaci na stronie Tpay. Bez kluczy TPAY_* działa lokalna bramka testowa /platnosc/test/[id].
// Zmienne w Vercel: TPAY_CLIENT_ID, TPAY_CLIENT_SECRET (Panel Tpay → Integracja → API → Klucze Open API),
// TPAY_SECURITY_CODE (Panel Tpay → Powiadomienia → Bezpieczeństwo), opcjonalnie TPAY_SANDBOX=1.

export type PayMethod = "blik" | "card" | "gpay" | "apay";
// Identyfikatory metod w Tpay (dokumentacja Open API): BLIK grupa 150, karty 103, Google Pay 166, Apple Pay kanał 75.
const PAY: Record<PayMethod, { groupId?: number; channelId?: number }> = {
  blik: { groupId: 150 },
  card: { groupId: 103 },
  gpay: { groupId: 166 },
  apay: { channelId: 75 },
};

const base = () => (process.env.TPAY_SANDBOX === "1" ? "https://openapi.sandbox.tpay.com" : "https://api.tpay.com");
export const paymentsLive = () => !!(process.env.TPAY_CLIENT_ID && process.env.TPAY_CLIENT_SECRET);
export const paymentsMode = () => (!paymentsLive() ? "brak" : process.env.TPAY_SANDBOX === "1" ? "testowy (sandbox)" : "PRAWDZIWE PŁATNOŚCI");

/** Bramka testowa działa lokalnie i na kopiach testowych Vercel, nigdy na produkcji z prawdziwymi płatnościami. */
export const testPayAllowed = () => !paymentsLive() && (process.env.VERCEL_ENV !== "production" || process.env.TEST_PAY === "1") && (process.env.NODE_ENV !== "production" || !!process.env.VERCEL_ENV);

let token: { value: string; until: number } | null = null;
async function auth() {
  if (token && token.until > Date.now() + 60_000) return token.value;
  const r = await fetch(`${base()}/oauth/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.TPAY_CLIENT_ID ?? "", client_secret: process.env.TPAY_CLIENT_SECRET ?? "" }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!r.ok) throw new Error(`Tpay auth ${r.status}`);
  const d = (await r.json()) as { access_token: string; expires_in: number };
  token = { value: d.access_token, until: Date.now() + d.expires_in * 1000 };
  return token.value;
}

export async function tpay<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${base()}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { Authorization: `Bearer ${await auth()}`, "Content-Type": "application/json", Accept: "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const d = (await r.json().catch(() => ({}))) as T;
  if (!r.ok) throw new Error(`Tpay ${path} ${r.status}: ${JSON.stringify(d).slice(0, 300)}`);
  return d;
}

const zl = (grosze: number) => Math.round(grosze) / 100;

/** Jedna płatność za jedną rezerwację albo całą grupę stanowisk na ten sam termin. Bez metody klient wybiera ją u Tpay. */
export async function createCheckout(list: Booking[], method?: PayMethod): Promise<{ url: string; ref: string | null }> {
  const b = list[0];
  if (!paymentsLive()) return { url: `/platnosc/test/${b.id}`, ref: null };
  const names = list.map((x) => `${simById(x.simulatorId)?.name ?? "Symulator"} ${x.durationMin} min`).join(", ");
  const t = await tpay<{ transactionId: string; transactionPaymentUrl: string }>("/transactions", {
    amount: zl(list.reduce((s, x) => s + x.priceGross, 0)),
    currency: "PLN",
    description: `2Real Simracing ${b.code}: ${names}`.slice(0, 128),
    hiddenDescription: b.id,
    lang: b.locale === "en" ? "en" : "pl",
    payer: { email: b.email, name: b.name.length >= 3 ? b.name : `${b.name} -`, phone: b.phone },
    pay: method ? PAY[method] : {},
    callbacks: {
      payerUrls: { success: `${appUrl()}/rezerwacja/sukces?b=${b.id}`, error: `${appUrl()}/rezerwacja/anulowano?b=${b.id}` },
      notification: { url: `${appUrl()}/api/tpay/notify` },
    },
  });
  return { url: t.transactionPaymentUrl, ref: t.transactionId };
}

/** Status transakcji w Tpay: pending, paid, correct, refund, canceled. */
export async function paymentStatus(ref: string) {
  if (!paymentsLive()) return null;
  const t = await tpay<{ status: string; payments?: { method?: string } }>(`/transactions/${ref}`).catch(() => null);
  return t ? { paid: t.status === "paid" || t.status === "correct", status: t.status, method: t.payments?.method } : null;
}

/** Nieopłacona transakcja po końcu blokady: zamykamy ją, żeby nikt nie zapłacił za termin, który wrócił do sprzedaży. */
export async function expireCheckout(ref: string) {
  if (!paymentsLive()) return;
  await tpay(`/transactions/${ref}/cancel`, {}).catch(() => {
    /* już opłacona albo zamknięta */
  });
}

/** Zwraca pieniądze (także część kwoty, np. jedno stanowisko z grupy). Przy płatności testowej tylko zapisuje kwotę. */
export async function refund(b: Booking, amount: number) {
  if (amount <= 0) return true;
  if (!paymentsLive() || b.paymentProvider !== "tpay" || !b.paymentRef) return true;
  await tpay(`/transactions/${b.paymentRef}/refunds`, { amount: zl(amount) });
  return true;
}

/** Podpis powiadomienia Tpay: md5(id + tr_id + tr_amount + tr_crc + kod bezpieczeństwa). */
export function notificationValid(f: Record<string, string>) {
  const code = process.env.TPAY_SECURITY_CODE ?? "";
  const sum = createHash("md5").update(`${f.id ?? ""}${f.tr_id ?? ""}${f.tr_amount ?? ""}${f.tr_crc ?? ""}${code}`).digest("hex");
  return !!code && sum === f.md5sum;
}
