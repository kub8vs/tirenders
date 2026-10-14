import Stripe from "stripe";
import type { Booking } from "@prisma/client";
import { simById } from "@/config/site";
import { appUrl } from "./templates";

// Stripe Checkout: BLIK, karta (z Apple Pay / Google Pay), Przelewy24.
// Bez STRIPE_SECRET_KEY działa lokalna bramka testowa /platnosc/test/[id].

let client: Stripe | null = null;
export function stripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  client ??= new Stripe(key);
  return client;
}

export const paymentsLive = () => !!process.env.STRIPE_SECRET_KEY;

/** Jedna płatność za jedną rezerwację albo całą grupę stanowisk na ten sam termin. */
export async function createCheckout(list: Booking[]): Promise<string> {
  const b = list[0];
  const s = stripe();
  if (!s) return `/platnosc/test/${b.id}`;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    currency: "pln",
    payment_method_types: ["blik", "card", "p24"],
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
    expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    success_url: `${appUrl()}/rezerwacja/sukces?b=${b.id}`,
    cancel_url: `${appUrl()}/rezerwacja/anulowano?b=${b.id}`,
  });
  return session.url!;
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
