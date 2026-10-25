import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { alarm } from "@/lib/alarm";
import { markPaid } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/payments";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "not_configured" }, { status: 400 });
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = s.webhooks.constructEvent(raw, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "signature" }, { status: 400 });
  }

  try {
    await handle(s, event);
  } catch (e) {
    // 500 = Stripe ponowi powiadomienie sam (przez kilka dni), a my dostajemy alarm.
    await alarm("płatność Stripe (webhook)", e);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

async function handle(s: Stripe, event: Stripe.Event) {
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const id = session.metadata?.bookingId;
    if (id && session.payment_status === "paid") {
      let method: string | undefined;
      if (typeof session.payment_intent === "string") {
        const pi = await s.paymentIntents.retrieve(session.payment_intent, { expand: ["payment_method"] });
        method = (pi.payment_method as Stripe.PaymentMethod | null)?.type;
      }
      await markPaid(id, { provider: "stripe", ref: session.id, method });
    }
  }
  if (event.type === "checkout.session.expired") {
    const meta = (event.data.object as Stripe.Checkout.Session).metadata;
    const id = meta?.bookingId;
    if (id) await prisma.booking.updateMany({ where: { OR: [{ id }, ...(meta?.groupId ? [{ groupId: meta.groupId }] : [])], status: "PENDING" }, data: { status: "EXPIRED" } });
  }
}
