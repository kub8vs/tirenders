import LegalPage from "@/components/LegalPage";
import { SITE } from "@/config/site";

export const metadata = { title: "Polityka prywatności" };

export default function Page() {
  return (
    <LegalPage title="Polityka prywatności" updated="10.10.2026">
      <h2>Administrator</h2>
      <p>Administratorem danych jest [pełna nazwa firmy], [adres], NIP [NIP]. Kontakt w sprawie danych: {SITE.email}.</p>
      <h2>Jakie dane i po co</h2>
      <ul>
        <li>Imię i nazwisko, e-mail, telefon – żeby zrealizować rezerwację, wysłać potwierdzenie i przypomnienia (e-mail i SMS). Podstawa: wykonanie umowy (art. 6 ust. 1 lit. b RODO).</li>
        <li>Historia rezerwacji i płatności – rozliczenia i obowiązki podatkowe (art. 6 ust. 1 lit. c RODO).</li>
        <li>Prośba o opinię po wizycie – prawnie uzasadniony interes (art. 6 ust. 1 lit. f RODO). Możesz się wypisać w każdej chwili.</li>
      </ul>
      <h2>Komu przekazujemy dane</h2>
      <p>Dostawcom, bez których usługa nie działa: operator płatności [Stripe], wysyłka e-maili [Resend], wysyłka SMS [SMSAPI.pl / LINK Mobility], hosting [Vercel, baza danych]. Część z nich może przetwarzać dane poza EOG na podstawie standardowych klauzul umownych.</p>
      <h2>Jak długo</h2>
      <p>Dane konta – do jego usunięcia. Dane rozliczeniowe – 5 lat od końca roku podatkowego.</p>
      <h2>Twoje prawa</h2>
      <p>Masz prawo do dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz sprzeciwu, a także skargi do Prezesa UODO.</p>
      <h2>Cookies</h2>
      <p>Szczegóły w <a href="/cookies">polityce cookies</a>.</p>
    </LegalPage>
  );
}
