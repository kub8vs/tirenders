import LegalPage from "@/components/LegalPage";

export const metadata = { title: "Cookies" };

export default function Page() {
  return (
    <LegalPage title="Cookies" updated="10.10.2026">
      <p>Strona używa wyłącznie niezbędnych plików cookies. Nie używamy cookies analitycznych ani reklamowych, dlatego nie pytamy o zgodę.</p>
      <ul>
        <li><b>next-auth.session-token</b> – utrzymuje zalogowanie na koncie (30 dni).</li>
        <li><b>next-auth.csrf-token</b>, <b>next-auth.callback-url</b> – bezpieczeństwo logowania.</li>
        <li><b>lang</b> – zapamiętuje wybrany język (12 miesięcy).</li>
      </ul>
      <p>Podczas płatności operator płatności może zapisać własne cookies niezbędne do jej przeprowadzenia.</p>
    </LegalPage>
  );
}
