import FaqRadio from "@/components/faq/FaqRadio";
import Split from "@/components/Split";
import { BOOKING } from "@/config/site";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "FAQ" };

const QA = [
  { cat: "start", pl: ["Muszę umieć jeździć?", "Nie. Prawo jazdy nie jest potrzebne. Przed startem pokażemy Ci, jak działa kierownica i pedały, i dobierzemy poziom trudności."], en: ["Do I need to know how to drive?", "No. You don't need a licence. Before you start we'll show you the wheel and pedals and set the difficulty."] },
  { cat: "group", pl: ["Ile osób może jechać naraz?", "Mamy 7 stanowisk (jedno w budowie). Każde rezerwujesz osobno, więc w grupie robicie kilka rezerwacji na tę samą godzinę i ścigacie się razem."], en: ["How many people can drive at once?", "We have 7 rigs (one still being built). Each is booked separately, so a group makes several bookings for the same time and races together."] },
  { cat: "start", pl: ["Ile wcześniej mam przyjść?", `${BOOKING.arriveEarlyMin} minut przed godziną rezerwacji. Ustawimy fotel, pedały i lusterka, a Twoje minuty zaczną lecieć dopiero na torze.`], en: ["How early should I arrive?", `${BOOKING.arriveEarlyMin} minutes before your booking. We'll set your seat, pedals and mirrors, and your minutes only start on track.`] },
  { cat: "book", pl: ["Jak mogę odwołać rezerwację?", `Przez link w mailu albo w swoim koncie. Do ${BOOKING.freeCancelHours} h przed startem odwołasz bez kosztów i dostaniesz pełny zwrot. Później możesz już tylko bez dopłaty przełożyć termin, do ${BOOKING.rescheduleHours} h przed. Na mniej niż ${BOOKING.rescheduleHours} h przed rezerwacji nie da się już odwołać ani przełożyć.`], en: ["How do I cancel?", `Use the link in your email or your account. Up to ${BOOKING.freeCancelHours} h before the start it's free with a full refund. After that you can only reschedule at no cost, up to ${BOOKING.rescheduleHours} h before. Less than ${BOOKING.rescheduleHours} h before, the booking can no longer be cancelled or moved.`] },
  { cat: "book", pl: ["Jak daleko do przodu mogę rezerwować?", `Do ${BOOKING.maxDaysAhead} dni do przodu, najpóźniej godzinę przed startem.`], en: ["How far ahead can I book?", `Up to ${BOOKING.maxDaysAhead} days ahead, at the latest one hour before the start.`] },
  { cat: "book", pl: ["Czym zapłacę?", "BLIK-iem, kartą, Apple Pay, Google Pay albo szybkim przelewem (Przelewy24). Płatność jest online przy rezerwacji."], en: ["How can I pay?", "BLIK, card, Apple Pay, Google Pay or instant bank transfer (Przelewy24). You pay online when booking."] },
  { cat: "start", pl: ["Czy platformy ruchu to dla mnie?", "Jeśli źle znosisz karuzele, zacznij od stanowiska bez ruchu (BMW M4 albo GT3). Platformę 5DOF lub 6DOF zawsze możesz dorzucić następnym razem."], en: ["Are the motion rigs for me?", "If you get motion sick on rides, start with a static rig (BMW M4 or GT3). You can always try 5DOF or 6DOF next time."] },
  { cat: "group", pl: ["Chcę cały salon na urodziny albo event firmowy.", "Super. Wyłączność całego salonu i sesje dłuższe niż 90 minut ustalamy telefonicznie."], en: ["I want the whole venue for a birthday or company event.", "Great. Full-venue hire and sessions over 90 minutes are arranged by phone."] },
  { cat: "shop", pl: ["Czy mogę kupić kierownicę?", "Tak. Kierownice przerabiane z prawdziwych kierownic samochodowych kupisz na miejscu. Wcześniej możesz je przetestować na naszych stanowiskach."], en: ["Can I buy a wheel?", "Yes. Wheels converted from real car steering wheels are sold in the venue. You can test them on our rigs first."] },
];

export default function Page() {
  const l = getLang();
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow" data-reveal>FAQ · {tr(l, { pl: "radio z boksu", en: "pit radio" })}</p>
        <Split as="h1" text={tr(l, { pl: "Pytania z padoku.", en: "Questions from the paddock." })} />
        <p data-reveal>{tr(l, { pl: "Kliknij pytanie, a boks odpowie przez radio.", en: "Tap a question and the pit wall answers over the radio." })}</p>
      </div>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <FaqRadio lang={l} items={QA.map((q) => ({ cat: q.cat, q: q[l][0], a: q[l][1] }))} />
        </div>
      </section>
    </>
  );
}
