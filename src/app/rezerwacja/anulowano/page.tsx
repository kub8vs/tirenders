import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLang, tr } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { b?: string } }) {
  const l = getLang();
  // Klient wrócił z płatności bez płacenia: zwalniamy termin od razu.
  // Rezerwacja telefoniczna (link z SMS-a) czeka dalej do końca swojego czasu, klient może wrócić do linku.
  if (searchParams.b) await prisma.booking.updateMany({ where: { id: searchParams.b, status: "PENDING", source: "ONLINE" }, data: { status: "EXPIRED" } });
  return (
    <div className="wrap page-hero" style={{ minHeight: "70vh" }}>
      <h1>{tr(l, { pl: "Płatność przerwana.", en: "Payment cancelled." })}</h1>
      <p>{tr(l, { pl: "Nic nie pobraliśmy, a termin wrócił do puli. Możesz spróbować jeszcze raz.", en: "Nothing was charged and the slot is back in the pool. You can try again." })}</p>
      <div style={{ marginTop: 30 }}>
        <Link className="btn-white" href="/rezerwacja">{tr(l, { pl: "Wróć do rezerwacji", en: "Back to booking" })}</Link>
      </div>
    </div>
  );
}
