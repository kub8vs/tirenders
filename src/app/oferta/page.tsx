import Link from "next/link";
import RigCards from "@/components/home/RigCards";
import Split from "@/components/Split";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Oferta" };

export default function Page() {
  const l = getLang();
  const formats = [
    { pl: ["Szybki stint", "15–30 minut. Wpadasz, ustawiamy fotel, jedziesz. Idealne na pierwszy raz."], en: ["Quick stint", "15–30 minutes. Drop in, we set your seat, you drive. Perfect for a first time."] },
    { pl: ["Pełny wyścig", "45–90 minut. Czas na kwalifikacje, wyścig i rewanż z kumplem na sąsiednim stanowisku."], en: ["Full race", "45–90 minutes. Time for qualifying, a race and a rematch with your mate on the next rig."] },
    { pl: ["Cały salon", "Urodziny, event firmowy, liga znajomych. Wszystkie stanowiska na wyłączność. Ustalasz telefonicznie."], en: ["Whole venue", "Birthday, company event, a league with friends. All rigs to yourselves. Arranged by phone."] },
  ];
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow">{tr(l, { pl: "Oferta", en: "Offer" })}</p>
        <Split as="h1" text={tr(l, { pl: "Prawdziwe auta. Wirtualny tor.", en: "Real cars. Virtual track." })} />
        <p>
          {tr(l, {
            pl: "Pierwszy w Polsce salon, w którym siadasz w pełnej karoserii auta z oryginalnym kokpitem. Do tego platformy ruchu 5DOF i 6DOF, które oddają każde hamowanie, każdy krawężnik i każdy uślizg.",
            en: "Poland's first venue where you sit in a full car body with its original cockpit. Plus 5DOF and 6DOF motion platforms that pass on every brake, kerb and slide.",
          })}
        </p>
      </div>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <RigCards lang={l} soon={tr(l, { pl: "W budowie", en: "Being built" })} from={tr(l, { pl: "od", en: "from" })} />
        </div>
      </section>
      <section className="section">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{tr(l, { pl: "Formaty", en: "Formats" })}</p>
            <Split className="sec-title" text={tr(l, { pl: "Jak chcesz jechać?", en: "How do you want to drive?" })} />
          </div>
          <div className="cards">
            {formats.map((f, i) => (
              <div className="card glass" key={i} data-reveal data-delay={i * 110} style={{ minHeight: 240, alignContent: "space-between" }}>
                <h3>{f[l][0]}</h3>
                <p>{f[l][1]}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: "flex", gap: 10, flexWrap: "wrap" }} data-reveal>
            <Link href="/rezerwacja" className="btn-white">{tr(l, { pl: "Zarezerwuj", en: "Book now" })}</Link>
            <Link href="/cennik" className="btn-ghost" style={{ height: 54 }}>{tr(l, { pl: "Cennik", en: "Pricing" })}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
