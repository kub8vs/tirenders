import Cta from "@/components/Cta";
import Rich from "@/components/Rich";
import Split from "@/components/Split";
import { SITE } from "@/config/site";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Individual" };

// Roboczy kafelek „Individual” – szczegóły oferty Tirenders ustali razem z klientem.
export default function Page() {
  const l = getLang();
  const ideas = [
    { pl: ["Grupy i urodziny", "Kilka stanowisk na tę samą godzinę, *wspólny wyścig* i podium."], en: ["Groups and birthdays", "Several rigs at the same time, *one race* and a podium."] },
    { pl: ["Firmy i eventy", "Cały salon na wyłączność, *turniej dla zespołu*, Wasz branding."], en: ["Companies and events", "The whole venue to yourselves, *a team tournament*, your branding."] },
    { pl: ["Treningi", "Sesje z instruktorem i *analiza przejazdu*. Dla tych, którzy chcą być szybsi."], en: ["Coaching", "Sessions with an instructor and *lap analysis*. For those who want to go faster."] },
  ];
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow">{tr(l, { pl: "Oferta", en: "Offer" })} / Individual</p>
        <Split as="h1" text={tr(l, { pl: "Oferta *szyta pod Ciebie.*", en: "An offer *built around you.*" })} />
        <p>
          <Rich text={tr(l, { pl: "Masz pomysł, który nie mieści się w cenniku? *Napisz albo zadzwoń*, a ustalimy szczegóły razem.", en: "Got an idea that doesn't fit the price list? *Message or call us* and we'll work out the details together." })} />
        </p>
      </div>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="cards">
            {ideas.map((f, i) => (
              <div className="card glass" key={i} data-reveal data-delay={i * 110} style={{ minHeight: 220, alignContent: "space-between" }}>
                <h3>{f[l][0]}</h3>
                <p>
                  <Rich text={f[l][1]} />
                </p>
              </div>
            ))}
          </div>
          <div className="cta-row" style={{ marginTop: 40 }} data-reveal>
            {SITE.phone ? (
              <Cta external href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                {tr(l, { pl: "Zadzwoń", en: "Call us" })}
              </Cta>
            ) : (
              <Cta external href={`mailto:${SITE.email}`}>
                {tr(l, { pl: "Napisz do nas", en: "Email us" })}
              </Cta>
            )}
            <Cta href="/oferta" ghost>
              {tr(l, { pl: "Wróć do oferty", en: "Back to offer" })}
            </Cta>
          </div>
        </div>
      </section>
    </>
  );
}
