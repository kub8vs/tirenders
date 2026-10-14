import Link from "next/link";
import { notFound } from "next/navigation";
import Cta from "@/components/Cta";
import Rich from "@/components/Rich";
import Split from "@/components/Split";
import VideoLoop from "@/components/VideoLoop";
import { BOOKING, PRICES, SIMULATORS, simById } from "@/config/site";
import { SIM_CLIPS } from "@/config/media";
import { getLang, tr } from "@/lib/i18n";

// Język z ciasteczka, więc strona renderuje się na żądanie, jak reszta podstron.
export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }) {
  const s = simById(params.id);
  return { title: s ? s.name : "Oferta" };
}

// Krótkie opisy do czasu, aż Tirenders przyśle finalne teksty (klient: „opisy dopracujemy wspólnie”).
const KIND: Record<string, { pl: string; en: string }> = {
  STANDARD: { pl: "Pełna karoseria", en: "Full car body" },
  GT3: { pl: "Kokpit wyścigowy", en: "Race cockpit" },
  MOTION5: { pl: "Platforma ruchu 5DOF", en: "5DOF motion platform" },
  MOTION6: { pl: "Platforma ruchu 6DOF", en: "6DOF motion platform" },
};

export default function Page({ params }: { params: { id: string } }) {
  const l = getLang();
  const s = simById(params.id);
  if (!s) notFound();
  const i = SIMULATORS.indexOf(s);
  const next = SIMULATORS[(i + 1) % SIMULATORS.length];
  const clip = SIM_CLIPS[s.id];
  const active = s.status === "ACTIVE";
  const [first, ...rest] = s.name.split(" ");
  const specs: [string, string][] = [
    [tr(l, { pl: "Typ", en: "Type" }), KIND[s.priceGroup][l]],
    [tr(l, { pl: "Ruch", en: "Motion" }), s.dof ? `${s.dof}DOF` : tr(l, { pl: "Statyczne", en: "Static" })],
    [tr(l, { pl: "Czas jazdy", en: "Session" }), `${BOOKING.durations[0]}–${BOOKING.durations[BOOKING.durations.length - 1]} min`],
    [tr(l, { pl: "Status", en: "Status" }), active ? tr(l, { pl: "Dostępne", en: "Available" }) : tr(l, { pl: "W budowie", en: "Being built" })],
  ];
  return (
    <>
      <div className="wrap page-hero sim-hero">
        <p className="eyebrow">
          <Link href="/oferta">{tr(l, { pl: "Oferta", en: "Offer" })}</Link> / {tr(l, { pl: "Stanowisko", en: "Rig" })} #{i + 1}
        </p>
        <Split as="h1" text={rest.length ? `${first} *${rest.join(" ")}*` : `*${first}*`} />
        <p>
          <Rich text={`${s.body[l]}.`} />
        </p>
        <div className="cta-row" style={{ marginTop: 34 }}>
          {active ? (
            <Cta href={`/rezerwacja?sim=${s.id}`} big>
              {tr(l, { pl: "Zarezerwuj to stanowisko", en: "Book this rig" })}
            </Cta>
          ) : (
            <span className="rig-tag soon">{tr(l, { pl: "Wkrótce w salonie", en: "Coming soon" })}</span>
          )}
          <Cta href="/oferta" ghost>
            {tr(l, { pl: "Wszystkie stanowiska", en: "All rigs" })}
          </Cta>
        </div>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap sim-grid">
          <div className={`sim-media ${clip ? "" : "is-empty"}`} data-reveal>
            {clip ? (
              <VideoLoop clip={clip} className="sim-video" label={`${s.name}: ${tr(l, { pl: "nagranie z jazdy", en: "onboard footage" })}`} />
            ) : (
              <span className="sim-num" aria-hidden="true">#{i + 1}</span>
            )}
            <span className="sim-media-tag">{clip ? "ONBOARD" : tr(l, { pl: "Zdjęcia wkrótce", en: "Photos soon" })}</span>
          </div>
          <div className="sim-side" data-reveal data-delay={120}>
            <dl className="sim-specs">
              {specs.map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
            <p className="eyebrow" style={{ marginTop: 34 }}>{tr(l, { pl: "Cennik tego stanowiska", en: "Pricing for this rig" })}</p>
            <ul className="sim-prices">
              {BOOKING.durations.map((d) => (
                <li key={d}>
                  <span>
                    {d} <small>min</small>
                  </span>
                  <b>{PRICES[s.priceGroup][d]} zł</b>
                </li>
              ))}
            </ul>
            <p className="hint-sm">{tr(l, { pl: "Ceny brutto za jedno stanowisko i jedną osobę. Rękawiczki w cenie.", en: "Gross prices for one rig and one person. Gloves included." })}</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap sim-next">
          <p className="eyebrow">{tr(l, { pl: "Następne stanowisko", en: "Next rig" })}</p>
          <Link href={`/oferta/${next.id}`} className="sim-next-link">
            <span>#{SIMULATORS.indexOf(next) + 1}</span> {next.name} <i aria-hidden="true">→</i>
          </Link>
        </div>
      </section>
    </>
  );
}
