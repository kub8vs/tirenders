import Stripe from "stripe";
import type { Booking } from "@prisma/client";
import { simById } from "@/config/site";
import { appUrl } from "./templates";

// Stripe Checkout: BLIK i karta. Apple Pay / Google Pay działają w ramach "card" (bez przelewów).
// Bez STRIPE_SECRET_KEY działa lokalna bramka testowa /platnosc/test/[id].

let client: Stripe | null = null;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const paymentsLive = () => !!process.env.STRIPE_SECRET_KEY;

/** Bramka testowa działa lokalnie i na kopiach testowych Vercel, nigdy na produkcji z prawdziwymi płatnościami. */
export const testPayAllowed = () => !paymentsLive() && process.env.VERCEL_ENV !== "production" && (process.env.NODE_ENV !== "production" || !!process.env.VERCEL_ENV);

/** Jedna płatność za jedną rezerwację albo całą grupę stanowisk na ten sam termin. */
export async function createCheckout(list: Booking[], expiresAt?: Date): Promise<{ url: string; ref: string | null }> {
  const b = list[0];
  const s = stripe();
  if (!s) return { url: `/platnosc/test/${b.id}`, ref: null };
  const session = await s.checkout.sessions.create({
    mode: "payment",
    currency: "pln",
    payment_method_types: ["blik", "card"],
    customer_email: b.email,
    locale: b.locale === "en" ? "en" : "pl",
    line_items: list.map((x) => ({
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: x.priceGross,
        product_data: { name: `${simById(x.simulatorId)?.name ?? "Symulator"} · ${x.durationMin} min`, description: `Rezerwacja ${x.code}` },
      },
    })),
    metadata: { bookingId: b.id, code: b.code, groupId: b.groupId ?? "" },
    payment_intent_data: { metadata: { bookingId: b.id, code: b.code, groupId: b.groupId ?? "" } },
    // Stripe wymaga min. 30 min; nasz własny hold (10 min) pilnuje slotu, a cron wygasza sesję wcześniej.
    // Link z SMS-a (rezerwacja telefoniczna) żyje tyle, co jej blokada, maks. 24 h.
    expires_at: Math.floor(Math.max(Date.now() + 31 * 60_000, Math.min(expiresAt?.getTime() ?? 0, Date.now() + 23.9 * 3_600_000)) / 1000),
    success_url: `${appUrl()}/rezerwacja/sukces?b=${b.id}`,
    cancel_url: `${appUrl()}/rezerwacja/anulowano?b=${b.id}`,
  });
  return { url: session.url!, ref: session.id };
}

/** Adres sesji Stripe do ponownego otwarcia (link z SMS-a), jeśli jeszcze można zapłacić. */
export async function checkoutUrl(ref: string) {
  const s = stripe();
  if (!s) return null;
  const session = await s.checkout.sessions.retrieve(ref).catch(() => null);
  return session?.status === "open" ? session.url : null;
}

export async function expireCheckout(sessionId: string) {
  const s = stripe();
  if (!s) return;
  try {
    await s.checkout.sessions.expire(sessionId);
  } catch {
    /* już zakończona */
  }
}

/** Zwraca pieniądze. Przy płatności testowej tylko zapisuje kwotę. */
export async function refund(b: Booking, amount: number) {
  if (amount <= 0) return true;
  const s = stripe();
  if (!s || b.paymentProvider !== "stripe" || !b.paymentRef) return true;
  const session = await s.checkout.sessions.retrieve(b.paymentRef);
  const pi = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!pi) return false;
  await s.refunds.create({ payment_intent: pi, amount });
  return true;
}
