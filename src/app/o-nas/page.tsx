import Cta from "@/components/Cta";
import Manifesto from "@/components/Manifesto";
import Marquee from "@/components/Marquee";
import Split from "@/components/Split";
import { SITE } from "@/config/site";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "O nas" };

const SLOGANS = [
  { img: "/img/ig/tirenders-post-2.jpg", pl: ["Prawdziwe auto.", "Prawdziwe nerwy."], en: ["Real car.", "Real nerves."], tag: { pl: "BMW M4 F82", en: "BMW M4 F82" } },
  { img: "/img/ig/tirenders-post-1.jpg", pl: ["Zloty. Drift. Festiwale.", "Teraz własny pit lane."], en: ["Meets. Drift. Festivals.", "Now our own pit lane."], tag: { pl: "Baltic Drive Festival", en: "Baltic Drive Festival" } },
  { img: "/img/ig/tirenders-6.jpg", pl: ["Ekipa, która", "żyje motoryzacją."], en: ["A crew that", "lives for cars."], tag: { pl: "Tirenders", en: "Tirenders" } },
  { img: "/img/ig/2real-1.jpg", pl: ["Warszawa. 15.11.", "Wpadaj."], en: ["Warsaw. 15 Nov.", "Come by."], tag: { pl: "2Real Simracing", en: "2Real Simracing" } },
];

const NUMBERS = [
  ["6", { pl: "stanowisk", en: "rigs" }],
  ["3", { pl: "platformy ruchu", en: "motion platforms" }],
  ["2", { pl: "prawdziwe karoserie", en: "real car bodies" }],
  ["0", { pl: "nudy", en: "boredom" }],
] as const;

export default function Page() {
  const l = getLang();
  return (
    <>
      <section className="about-hero">
        <div className="wrap">
          <p className="eyebrow" data-reveal>{tr(l, { pl: "O nas", en: "About" })}</p>
          <Manifesto autoplay text={tr(l, { pl: "Ty nie grasz. Ty prowadzisz.", en: "You don't play. You drive." })} />
        </div>
        <div className="about-collage" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/ig/tirenders-3.jpg" alt="" data-parallax="0.25" className="c1" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/ig/tirenders-8.jpg" alt="" data-parallax="-0.15" className="c2" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/ig/tirenders-9.jpg" alt="" data-parallax="0.4" className="c3" />
        </div>
      </section>

      <Marquee items={tr(l, { pl: ["Tirenders", "2Real Simracing", "Warszawa", "Lights out"], en: ["Tirenders", "2Real Simracing", "Warsaw", "Lights out"] })} tone="red" />

      <section className="section">
        <div className="wrap slogans">
          {SLOGANS.map((s, i) => (
            <div className={`slogan ${i % 2 ? "flip" : ""}`} key={s.img}>
              <figure data-reveal>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.img} alt="" loading="lazy" data-parallax="0.08" />
                <figcaption>{s.tag[l]}</figcaption>
              </figure>
              <div className="slogan-text">
                <span className="slogan-n">0{i + 1}</span>
                <Split text={s[l][0]} />
                <Split text={s[l][1]} className="race-line" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap nums">
          {NUMBERS.map(([n, label]) => (
            <div className="num" key={n + label.pl} data-reveal>
              <b data-count={n}>{n}</b>
              <span>{label[l]}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="wrap socials">
          <p className="eyebrow" data-reveal>{tr(l, { pl: "Śledź nas", en: "Follow us" })}</p>
          {[
            ["@tirenders_", SITE.instagram.tirenders],
            ["@2realsimracing", SITE.instagram.salon],
            ["@x.himera", SITE.instagram.himera],
          ].map(([h, url]) => (
            <a key={h} href={url} target="_blank" rel="noreferrer" className="social-link" data-reveal>
              <span>{h}</span>
              <i aria-hidden="true">↗</i>
            </a>
          ))}
          <p style={{ color: "var(--muted)", marginTop: 30 }} data-reveal>
            {SITE.address ?? tr(l, { pl: "Warszawa. Dokładny adres ogłosimy przed otwarciem.", en: "Warsaw. Exact address announced before opening." })}
          </p>
          <div style={{ marginTop: 30 }} data-reveal>
            <Cta href="/rezerwacja">{tr(l, { pl: "Zarezerwuj już teraz", en: "Book now" })}</Cta>
          </div>
        </div>
      </section>
    </>
  );
}
