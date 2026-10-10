import BookingFlow from "@/components/booking/BookingFlow";
import { currentUser } from "@/lib/auth";
import { getLang, tr } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rezerwacja" };

export default async function Page({ searchParams }: { searchParams: { sim?: string } }) {
  const l = getLang();
  const u = await currentUser();
  return (
    <div className="wrap" style={{ paddingTop: "clamp(130px, 13vw, 180px)", paddingBottom: 120 }}>
      <div className="sec-head">
        <p className="eyebrow">{tr(l, { pl: "Rezerwacja", en: "Booking" })}</p>
        <h1 className="sec-title">{tr(l, { pl: "Zajmij swój slot.", en: "Grab your slot." })}</h1>
        <p className="sec-lead">
          {tr(l, {
            pl: "Każde stanowisko rezerwujesz osobno: jedna osoba, jedna rezerwacja, jedna płatność. Jedziecie we dwóch? Zrób dwie rezerwacje na tę samą godzinę.",
            en: "Each rig is booked on its own: one person, one booking, one payment. Coming with a mate? Make two bookings for the same time.",
          })}
        </p>
      </div>
      <BookingFlow lang={l} signedIn={!!u} prefill={u ? { name: u.name ?? "", email: u.email, phone: u.phone ?? "" } : null} initialSim={searchParams.sim} />
    </div>
  );
}
