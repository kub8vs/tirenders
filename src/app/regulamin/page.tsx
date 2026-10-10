import LegalPage from "@/components/LegalPage";
import { BOOKING, SITE } from "@/config/site";

export const metadata = { title: "Regulamin" };

export default function Page() {
  return (
    <LegalPage title="Regulamin" updated="10.10.2026">
      <h2>1. Kto świadczy usługi</h2>
      <p>Usługi w salonie {SITE.salon} w {SITE.city} świadczy [pełna nazwa firmy], [adres rejestrowy], NIP [NIP] („Usługodawca”). Kontakt: {SITE.email}{SITE.phone ? `, ${SITE.phone}` : ""}.</p>
      <h2>2. Usługa</h2>
      <p>Usługa polega na udostępnieniu jednego stanowiska symulatora jazdy (simracingu) jednej osobie na wybrany czas: 15, 30, 45, 60 lub 90 minut. Dłuższe sesje i wyłączność salonu ustalane są indywidualnie.</p>
      <h2>3. Rezerwacja i płatność</h2>
      <p>Rezerwacji dokonuje się przez stronę. Jedna rezerwacja obejmuje jedno stanowisko i jedną osobę. Rezerwacja jest wiążąca po opłaceniu. Wybrany termin jest blokowany na {BOOKING.holdMin} minut na dokonanie płatności. Rezerwacji można dokonać najpóźniej {BOOKING.minLeadMin} minut przed startem i najwcześniej {BOOKING.maxDaysAhead} dni wcześniej.</p>
      <p>Płatności obsługuje [operator płatności, np. Stripe Payments Europe Ltd.]. Dostępne metody: BLIK, karta płatnicza, Apple Pay, Google Pay, Przelewy24. Ceny podane są w złotych brutto.</p>
      <h2>4. Odwołanie i zmiana terminu</h2>
      <p>Klient może odwołać rezerwację bez kosztów do {BOOKING.freeCancelHours} godzin przed startem – otrzymuje wtedy zwrot 100% ceny. Zmiana terminu jest możliwa do {BOOKING.rescheduleHours} godzin przed startem, na stanowisko z tej samej kategorii cenowej. Po tych terminach opłata nie podlega zwrotowi, chyba że sesja nie odbyła się z winy Usługodawcy.</p>
      <p>Usługa jest świadczona w ściśle określonym terminie, dlatego zgodnie z art. 38 ust. 1 pkt 12 ustawy o prawach konsumenta konsumentowi nie przysługuje ustawowe prawo odstąpienia od umowy. Zasady odwołania z akapitu wyżej to dobrowolne uprawnienie przyznane przez Usługodawcę. [do potwierdzenia przez prawnika]</p>
      <h2>5. Na miejscu</h2>
      <ul>
        <li>Prosimy o przybycie 10 minut przed startem. Spóźnienie skraca czas sesji.</li>
        <li>Minimalny wiek i wzrost: [do uzupełnienia]. Osoby niepełnoletnie korzystają z usługi za zgodą opiekuna.</li>
        <li>Na platformach ruchu (5DOF, 6DOF) nie mogą jeździć kobiety w ciąży, osoby z chorobami serca, kręgosłupa, epilepsją ani pod wpływem alkoholu lub środków odurzających.</li>
        <li>Obsługa może przerwać sesję, jeśli zachowanie klienta zagraża bezpieczeństwu lub sprzętowi.</li>
        <li>Za umyślne zniszczenie sprzętu odpowiada klient.</li>
      </ul>
      <h2>6. Reklamacje</h2>
      <p>Reklamacje można składać na adres {SITE.email}. Odpowiadamy w ciągu 14 dni.</p>
      <h2>7. Dane osobowe</h2>
      <p>Zasady przetwarzania danych opisuje <a href="/polityka-prywatnosci">polityka prywatności</a>.</p>
    </LegalPage>
  );
}
