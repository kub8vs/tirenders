import Link from "next/link";
import Hero from "@/components/hero/Hero";
import ColorGallery from "@/components/home/ColorGallery";
import HowTrack from "@/components/home/HowTrack";
import RigCards from "@/components/home/RigCards";
import SectorStrip from "@/components/home/SectorStrip";
import Manifesto from "@/components/Manifesto";
import Marquee from "@/components/Marquee";
import PriceTable from "@/components/PriceTable";
import Split from "@/components/Split";
import { getDict, getLang, tr } from "@/lib/i18n";

export default function Home() {
  const d = getDict();
  const l = getLang();
  const h = d.home;
  return (
    <>
      <Hero t={d.hero} />

      <section className="section" id="start">
        <div className="wrap">
          <SectorStrip specs={d.hero.specs} />
          <div style={{ marginTop: "clamp(90px, 12vw, 180px)" }}>
            <p className="eyebrow" data-reveal style={{ marginBottom: 28 }}>
              Tirenders × 2Real Simracing
            </p>
            <Manifesto text={h.manifesto} />
            <p className="manifesto-body" data-reveal>
              {h.manifestoBody}
            </p>
          </div>
        </div>
      </section>

      <Marquee items={tr(l, { pl: ["Lights out", "6DOF", "Prawdziwe karoserie", "Warszawa", "Ty prowadzisz", "Od 15.11"], en: ["Lights out", "6DOF", "Real car bodies", "Warsaw", "You drive", "From 15 Nov"] })} tone="red" />

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow" data-reveal>{h.rigsEyebrow}</p>
            <Split text={h.rigsTitle} className="sec-title" />
            <p className="sec-lead" data-reveal>{h.rigsLead}</p>
          </div>
          <RigCards lang={l} soon={h.soon} from={h.from} />
        </div>
      </section>

      <section className="section how-section">
        <div className="wrap">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow" data-reveal>{h.howEyebrow}</p>
            <Split text={h.howTitle} className="sec-title" />
          </div>
        </div>
        <HowTrack steps={h.steps} label={tr(l, { pl: "punkt kontrolny", en: "checkpoint" })} />
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow" data-reveal>{h.pricingEyebrow}</p>
            <Split text={h.pricingTitle} className="sec-title" />
          </div>
          <div data-reveal>
            <PriceTable lang={l} />
          </div>
          <div style={{ marginTop: 36 }} data-reveal>
            <Link href="/cennik" className="btn-ghost magnetic">
              {h.pricingCta} →
            </Link>
          </div>
        </div>
      </section>

      <section className="section gallery-section">
        <div className="wrap">
          <div className="sec-head">
            <p className="eyebrow" data-reveal>{h.galleryEyebrow}</p>
            <Split text={h.galleryTitle} className="sec-title" />
          </div>
        </div>
        <ColorGallery />
      </section>

      <section className="section">
        <div className="wrap split">
          <div className="sec-head" style={{ marginBottom: 0 }}>
            <p className="eyebrow" data-reveal>{h.shopEyebrow}</p>
            <Split text={h.shopTitle} className="sec-title" />
            <p className="sec-lead" data-reveal>{h.shopLead}</p>
            <div data-reveal>
              <Link href="/sklep" className="btn-white magnetic">
                {h.shopCta}
              </Link>
            </div>
          </div>
          <div className="shop-pair">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/ig/tirenders-4.jpg" alt="" loading="lazy" data-parallax="0.12" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/himera/wkrotce-dostepne-g0.jpg" alt="Kominiarka Himery" loading="lazy" data-parallax="-0.12" />
          </div>
        </div>
      </section>

      <Marquee items={tr(l, { pl: ["Zarezerwuj", "Wsiadaj", "Zapnij pasy", "Lights out"], en: ["Book", "Get in", "Buckle up", "Lights out"] })} tone="outline" reverse />

      <section className="section final">
        <div className="wrap" style={{ display: "grid", justifyItems: "center", gap: 26 }}>
          <Split text={h.finalTitle} />
          <p data-reveal>{h.finalLead}</p>
          <Link href="/rezerwacja" className="btn-white magnetic" data-reveal style={{ height: 64, padding: "0 56px" }}>
            {d.hero.cta}
          </Link>
        </div>
      </section>
    </>
  );
}
