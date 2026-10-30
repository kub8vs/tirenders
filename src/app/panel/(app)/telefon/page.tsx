import { redirect } from "next/navigation";
import PhoneBooking from "@/components/panel/PhoneBooking";
import { BOOKING, HOURS } from "@/config/site";
import { liveSims } from "@/lib/sims";
import { staffUser } from "@/lib/auth";
import { addDays, dowOf, todayWarsaw } from "@/lib/time";

const DAYS_AHEAD = 90;
const WEEKDAY = ["niedz.", "pon.", "wt.", "śr.", "czw.", "pt.", "sob."];
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export default async function Page() {
  if (!(await staffUser("calendar"))) redirect("/panel");
  const today = todayWarsaw();
  // Dni otwarcia na 90 dni do przodu z godzinami, w których można zacząć jazdę (co 15 min).
  const days = Array.from({ length: DAYS_AHEAD + 1 }, (_, i) => addDays(today, i)).flatMap((date) => {
    const h = HOURS[dowOf(date)];
    if (!h) return [];
    const [, m, d] = date.split("-");
    return [{ date, label: `${WEEKDAY[dowOf(date)]} ${d}.${m}${i0(date, today)}`, open: toMin(h.open), close: toMin(h.close) }];
  });
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
      <h1>Rezerwacja telefoniczna</h1>
      <p style={{ color: "var(--muted)", maxWidth: 640, margin: "0 auto 24px" }}>
        Wybrane stanowiska blokują się od razu. Klient dostaje SMS i mail z linkiem do zapłaty na stronie. Jeśli nie zapłaci w ciągu {BOOKING.payLinkHours} h (najpóźniej 15 min przed startem), termin wraca do sprzedaży.
      </p>
      <PhoneBooking days={days} step={BOOKING.slotStepMin} durations={[...BOOKING.durations]} sims={(await liveSims()).filter((s) => s.status === "ACTIVE").map((s) => ({ id: s.id, name: s.name }))} />
    </div>
  );
}

function i0(date: string, today: string) {
  return date === today ? " (dziś)" : date === addDays(today, 1) ? " (jutro)" : "";
}
