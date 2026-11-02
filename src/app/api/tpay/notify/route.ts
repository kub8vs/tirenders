import { alarm } from "@/lib/alarm";
import { markPaid } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { notificationValid, paymentStatus } from "@/lib/payments";

export const dynamic = "force-dynamic";

// Powiadomienie Tpay po opłaceniu transakcji (POST, formularz). Tpay ponawia je, dopóki nie odpowiemy „TRUE”.
// Sprawdzamy podpis md5 z kodem bezpieczeństwa, a status i tak potwierdzamy w API Tpay.
export async function POST(req: Request) {
  const f = Object.fromEntries((await req.formData()).entries()) as Record<string, string>;
  if (!notificationValid(f)) return new Response("FALSE - signature", { status: 400 });
  try {
    if (f.tr_status?.toUpperCase() === "TRUE") {
      const b = await prisma.booking.findUnique({ where: { id: f.tr_crc } });
      if (b?.paymentRef) {
        const st = await paymentStatus(b.paymentRef);
        if (st?.paid) await markPaid(b.id, { provider: "tpay", ref: b.paymentRef, method: st.method });
      }
    }
    return new Response("TRUE", { headers: { "Content-Type": "text/plain" } });
  } catch (e) {
    // Bez „TRUE” Tpay spróbuje ponownie za minutę.
    await alarm("płatność Tpay (powiadomienie)", e);
    return new Response("FALSE", { status: 500 });
  }
}
