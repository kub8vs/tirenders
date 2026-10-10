import { notFound } from "next/navigation";
import { simById } from "@/config/site";
import { prisma } from "@/lib/db";
import { paymentsLive } from "@/lib/payments";
import { pln } from "@/lib/pricing";
import { fmtLong } from "@/lib/time";
import TestPay from "./TestPay";

export const dynamic = "force-dynamic";

// Lokalna bramka zastępująca Stripe, dopóki nie ma kluczy. Na produkcji niedostępna.
export default async function Page({ params }: { params: { id: string } }) {
  if (paymentsLive() || process.env.NODE_ENV === "production") notFound();
  const b = await prisma.booking.findUnique({ where: { id: params.id } });
  if (!b) notFound();
  return (
    <div className="wrap page-hero" style={{ maxWidth: 620, minHeight: "80vh" }}>
      <p className="notice">Tryb testowy: brak kluczy Stripe. Ta strona udaje bramkę płatności, żeby przejść cały proces lokalnie.</p>
      <h1 style={{ fontSize: 48, marginTop: 30 }}>{pln(b.priceGross)}</h1>
      <p>{simById(b.simulatorId)?.name} · {b.durationMin} min · {fmtLong(b.start, "pl")}</p>
      <TestPay id={b.id} status={b.status} />
    </div>
  );
}
