import Cta from "@/components/Cta";
import RigCards from "@/components/home/RigCards";
import Rich from "@/components/Rich";
import Split from "@/components/Split";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Oferta" };

export default function Page() {
  const l = getLang();
  const formats = [
    { n: "15–30", pl: ["Szybki stint", "Wpadasz, ustawiamy fotel, jedziesz. *Idealne na pierwszy raz.*"], en: ["Quick stint", "Drop in, we set your seat, you drive. *Perfect for a first time.*"] },
    { n: "45–90", pl: ["Pełny wyścig", "Kwalifikacje, wyścig i *rewanż z kumplem* na stanowisku obok."], en: ["Full race", "Qualifying, a race and a *rematch with your mate* on the next rig."] },
    { n: "90+", pl: ["Cały salon", "Urodziny, firma, liga znajomych. *Wszystkie stanowiska dla Was.* Ustalamy telefonicznie."], en: ["Whole venue", "Birthday, company event, a league with friends. *All rigs to yourselves.* Arranged by phone."] },
  ];
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow">{tr(l, { pl: "Oferta", en: "Offer" })}</p>
        <Split as="h1" text={tr(l, { pl: "Prawdziwe auta. *Wirtualny tor.*", en: "Real cars. *Virtual track.*" })} />
        <p>
          <Rich
            text={tr(l, {
              pl: "Siadasz w *pełnej karoserii* z oryginalnym kokpitem. Platformy 5DOF i 6DOF oddają *każde hamowanie i każdy uślizg.*",
              en: "You sit in a *full car body* with its original cockpit. 5DOF and 6DOF platforms pass on *every brake and every slide.*",
            })}
          />
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
            <Split className="sec-title" text={tr(l, { pl: "Jak chcesz *jechać?*", en: "How do you want *to drive?*" })} />
          </div>
          <div className="cards">
            {formats.map((f, i) => (
              <div className="card glass" key={i} data-reveal data-delay={i * 110} style={{ minHeight: 240, alignContent: "space-between" }}>
                <span className="fmt-n">
                  {f.n} <small>min</small>
                </span>
                <h3>{f[l][0]}</h3>
                <p>
                  <Rich text={f[l][1]} />
                </p>
              </div>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: 40 }} data-reveal>
            <Cta href="/rezerwacja">{tr(l, { pl: "Zarezerwuj", en: "Book now" })}</Cta>
            <Cta href="/cennik" ghost>
              {tr(l, { pl: "Zobacz cennik", en: "See pricing" })}
            </Cta>
          </div>
        </div>
      </section>
    </>
  );
}
