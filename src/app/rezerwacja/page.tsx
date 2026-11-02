import BookingFlow from "@/components/booking/BookingFlow";
import { currentUser } from "@/lib/auth";
import { BOOKING } from "@/config/site";
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
        <h1 className="sec-title">{tr(l, { pl: "Umów swoją jazdę.", en: "Book your drive." })}</h1>
        <p className="arrive-bar" role="note">
          <span className="arrive-ico" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2.5 2.5M9.5 2.5h5M12 2.5V5" />
            </svg>
          </span>
          <span>
            {tr(l, {
              pl: `Prosimy o przybycie do salonu ${BOOKING.arriveEarlyMin} minut przed godziną rezerwacji.`,
              en: `Please arrive at the venue ${BOOKING.arriveEarlyMin} minutes before your booking time.`,
            })}
          </span>
        </p>
        <p className="sec-lead">
          {tr(l, {
            pl: "Wybierz, ile jedziesz, potem stanowisko i godzinę. Jedziecie w kilka osób? Zaznacz kilka stanowisk: jedna płatność, a od 3 stanowisk taniej.",
            en: "Choose how long you drive, then your rig and time. Coming as a group? Pick several rigs: one payment, and 3+ rigs are cheaper.",
          })}
        </p>
      </div>
      <BookingFlow lang={l} signedIn={!!u} prefill={u ? { name: u.name ?? "", email: u.email, phone: u.phone ?? "" } : null} initialSim={searchParams.sim} />
    </div>
  );
}
