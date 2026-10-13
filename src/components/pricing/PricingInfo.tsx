"use client";

import { useEffect, useRef } from "react";
import Cta from "@/components/Cta";
import Rich from "@/components/Rich";
import { BOOKING, SITE } from "@/config/site";

const T = {
  pl: {
    payTitle: "Płacisz tylko za jazdę",
    payLead: "Stoper rusza dopiero, gdy wyjeżdżasz z boksu. *Wszystko przed startem jest gratis.*",
    free: [
      ["Ustawienie fotela i pedałów", "0 zł"],
      ["Briefing: gdzie hamować", "0 zł"],
      ["Rękawiczki i sprzęt", "0 zł"],
    ],
    cancelTitle: "Odwołanie i zmiana terminu",
    cancelLead: "Jak światła na starcie: zielone, żółte, czerwone.",
    zones: [
      ["green", "Więcej niż 24 h przed", "Odwołujesz za darmo. Oddajemy 100%."],
      ["amber", "24 h – 3 h przed", "Nie odwołasz, ale przełożysz termin bez dopłat."],
      ["red", "Mniej niż 3 h", "Termin jest Twój. Zmiany już nie są możliwe."],
    ],
    marks: ["Rezerwacja", "−24 h", "−3 h", "Start"],
    methodsTitle: "Płacisz od razu, online",
    hold: "Tyle trzymamy Twój termin, zanim wróci do puli",
    min: "min",
    groupTitle: "Dłużej niż 90 minut albo cały salon?",
    groupLead: "Urodziny, firma, liga znajomych. *Cały salon dla Was.* Ustalamy telefonicznie.",
    groupCta: "Zadzwoń",
    soon: "Numer telefonu wkrótce",
  },
  en: {
    payTitle: "You only pay for driving",
    payLead: "The stopwatch only starts when you leave the pits. *Everything before the start is free.*",
    free: [
      ["Seat and pedal setup", "0 zł"],
      ["Briefing: where to brake", "0 zł"],
      ["Gloves and gear", "0 zł"],
    ],
    cancelTitle: "Cancelling and rescheduling",
    cancelLead: "Like the start lights: green, amber, red.",
    zones: [
      ["green", "More than 24 h before", "Cancel for free. 100% back."],
      ["amber", "24 h – 3 h before", "No cancelling, but you can reschedule at no cost."],
      ["red", "Less than 3 h", "The slot is yours. No more changes."],
    ],
    marks: ["Booking", "−24 h", "−3 h", "Start"],
    methodsTitle: "Pay right away, online",
    hold: "How long we hold your slot before it goes back to the pool",
    min: "min",
    groupTitle: "Longer than 90 minutes or the whole venue?",
    groupLead: "Birthdays, company events, a league with friends. *The whole venue is yours.* Arranged by phone.",
    groupCta: "Call us",
    soon: "Phone number coming soon",
  },
};

const METHODS = ["BLIK", "Karta / Card", "Apple Pay", "Google Pay", "Przelewy24"];

export default function PricingInfo({ lang }: { lang: "pl" | "en" }) {
  const t = T[lang];
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const els = root.current!.querySelectorAll<HTMLElement>(".pi-anim");
    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.35 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, []);

  return (
    <div className="pi" ref={root}>
      {/* stoper */}
      <section className="pi-card pi-watch pi-anim">
        <div className="watch" aria-hidden="true">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="108" r="78" className="w-face" />
            <circle cx="100" cy="108" r="78" className="w-prog" />
            <rect x="90" y="12" width="20" height="14" rx="3" className="w-btn" />
            <line x1="100" y1="108" x2="100" y2="46" className="w-hand" />
            <circle cx="100" cy="108" r="5" fill="#fff" />
          </svg>
        </div>
        <div className="pi-text">
          <h2>{t.payTitle}</h2>
          <p>
            <Rich text={t.payLead} />
          </p>
          <ul className="free-list">
            {t.free.map(([a, b]) => (
              <li key={a}>
                <span>{a}</span>
                <b>{b}</b>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* oś czasu odwołań */}
      <section className="pi-card pi-anim">
        <div className="pi-text" style={{ maxWidth: "none" }}>
          <h2>{t.cancelTitle}</h2>
          <p>{t.cancelLead}</p>
        </div>
        <div className="tl">
          <div className="tl-bar">
            {t.zones.map(([c]) => (
              <span key={c} className={`tl-seg ${c}`} />
            ))}
          </div>
          <div className="tl-marks">
            {t.marks.map((m) => (
              <span key={m}>{m}</span>
            ))}
          </div>
          <div className="tl-zones">
            {t.zones.map(([c, a, b]) => (
              <div key={c} className={`tl-zone ${c}`}>
                <i className="lamp" />
                <b>{a}</b>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* płatności + hold */}
      <div className="pi-row">
        <section className="pi-card pi-anim">
          <div className="pi-text">
            <h2>{t.methodsTitle}</h2>
          </div>
          <ul className="methods">
            {METHODS.map((m, i) => (
              <li key={m} style={{ transitionDelay: `${i * 80}ms` }}>
                {m}
              </li>
            ))}
          </ul>
        </section>
        <section className="pi-card pi-hold pi-anim">
          <div className="hold-ring" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" className="h-bg" />
              <circle cx="60" cy="60" r="52" className="h-fg" />
            </svg>
            <b>
              {BOOKING.holdMin}
              <small>{t.min}</small>
            </b>
          </div>
          <p>{t.hold}</p>
        </section>
      </div>

      {/* grupy */}
      <section className="pi-card pi-group pi-anim">
        <div className="pi-text">
          <h2>{t.groupTitle}</h2>
          <p>
            <Rich text={t.groupLead} />
          </p>
        </div>
        <div className="group-cta">
          <b>{SITE.phone ?? t.soon}</b>
          {SITE.phone && (
            <Cta external href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
              {t.groupCta}
            </Cta>
          )}
        </div>
      </section>

      <style jsx>{`
        .pi { display: grid; gap: 12px; }
        .pi-card { border: 1px solid var(--line); border-radius: 22px; background: #070707; padding: clamp(22px, 3vw, 40px); position: relative; overflow: hidden; }
        .pi-text { max-width: 52ch; display: grid; gap: 10px; }
        .pi-text h2 { font-size: clamp(28px, 3.2vw, 46px); }
        .pi-text p { color: var(--muted); }
        .pi-row { display: grid; grid-template-columns: 1.6fr 1fr; gap: 12px; }
        @media (max-width: 860px) { .pi-row { grid-template-columns: minmax(0, 1fr); } }

        .pi-watch { display: grid; grid-template-columns: 240px minmax(0, 1fr); gap: clamp(20px, 4vw, 60px); align-items: center; }
        @media (max-width: 700px) { .pi-watch { grid-template-columns: minmax(0, 1fr); } .watch { max-width: 180px; } }
        .watch svg { width: 100%; height: auto; }
        .w-face { fill: none; stroke: rgba(255,255,255,.1); stroke-width: 10; }
        .w-prog { fill: none; stroke: var(--red); stroke-width: 10; stroke-linecap: round; stroke-dasharray: 490; stroke-dashoffset: 490; transform: rotate(-90deg); transform-origin: 100px 108px; transition: stroke-dashoffset 2.6s cubic-bezier(.6,0,.2,1); }
        .w-btn { fill: #333; }
        .w-hand { stroke: #fff; stroke-width: 3; stroke-linecap: round; transform-origin: 100px 108px; }
        .in .w-prog { stroke-dashoffset: 120; }
        .in .w-hand { animation: hand 2.6s cubic-bezier(.6,0,.2,1) forwards; }
        @keyframes hand { to { transform: rotate(272deg); } }
        .free-list { list-style: none; margin: 14px 0 0; padding: 0; display: grid; }
        .free-list li { display: flex; justify-content: space-between; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--line); opacity: 0; transform: translateX(-16px); transition: opacity .6s, transform .6s cubic-bezier(.16,1,.3,1); }
        .in .free-list li { opacity: 1; transform: none; }
        .in .free-list li:nth-child(2) { transition-delay: .15s; }
        .in .free-list li:nth-child(3) { transition-delay: .3s; }
        .free-list b { color: #9ff0c0; font-weight: 500; }

        .tl { margin-top: 36px; }
        .tl-bar { display: grid; grid-template-columns: 3fr 2fr 1fr; gap: 4px; height: 10px; }
        .tl-seg { border-radius: 6px; transform: scaleX(0); transform-origin: left; transition: transform .9s cubic-bezier(.6,0,.2,1); }
        .tl-seg.green { background: #1aff5a; box-shadow: 0 0 18px rgba(26,255,90,.5); }
        .tl-seg.amber { background: #ffc400; box-shadow: 0 0 18px rgba(255,196,0,.5); transition-delay: .5s; }
        .tl-seg.red { background: var(--red); box-shadow: 0 0 18px rgba(255,42,42,.5); transition-delay: 1s; }
        .in .tl-seg { transform: none; }
        .tl-marks { display: grid; grid-template-columns: 3fr 2fr 1fr 0fr; margin-top: 10px; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
        .tl-marks span:last-child { text-align: right; white-space: nowrap; transform: translateX(-100%); color: #fff; }
        .tl-zones { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 28px; }
        @media (max-width: 760px) { .tl-zones { grid-template-columns: minmax(0, 1fr); } }
        .tl-zone { border-radius: 16px; padding: 18px; border: 1px solid var(--line); display: grid; gap: 8px; opacity: 0; transform: translateY(14px); transition: opacity .6s, transform .6s; }
        .in .tl-zone { opacity: 1; transform: none; }
        .in .tl-zone.amber { transition-delay: .5s; }
        .in .tl-zone.red { transition-delay: 1s; }
        .tl-zone b { font-weight: 500; font-size: 17px; }
        .tl-zone span { color: var(--muted); font-size: 14px; }
        .lamp { width: 16px; height: 16px; border-radius: 50%; }
        .green .lamp { background: #1aff5a; box-shadow: 0 0 14px #1aff5a; }
        .amber .lamp { background: #ffc400; box-shadow: 0 0 14px #ffc400; }
        .red .lamp { background: var(--red); box-shadow: 0 0 14px var(--red); }

        .methods { list-style: none; margin: 22px 0 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        .methods li { padding: 14px 20px; border-radius: 14px; background: #fff; color: #000; font-weight: 600; font-size: 15px; opacity: 0; transform: translateY(16px) rotate(-3deg); transition: opacity .5s, transform .6s cubic-bezier(.16,1,.3,1); }
        .in .methods li { opacity: 1; transform: none; }
        .pi-hold { display: grid; justify-items: center; text-align: center; gap: 14px; align-content: center; }
        .pi-hold p { color: var(--muted); max-width: 28ch; }
        .hold-ring { position: relative; width: 150px; }
        .hold-ring svg { width: 100%; transform: rotate(-90deg); }
        .h-bg { fill: none; stroke: rgba(255,255,255,.08); stroke-width: 8; }
        .h-fg { fill: none; stroke: #ffc400; stroke-width: 8; stroke-linecap: round; stroke-dasharray: 327; stroke-dashoffset: 0; }
        .in .h-fg { animation: drain 10s linear infinite; }
        @keyframes drain { to { stroke-dashoffset: 327; } }
        .hold-ring b { position: absolute; inset: 0; display: grid; place-content: center; font-size: 46px; font-weight: 400; letter-spacing: -.04em; line-height: 1; }
        .hold-ring small { font-size: 12px; color: var(--muted); letter-spacing: .14em; text-transform: uppercase; }

        .pi-group { background: radial-gradient(120% 140% at 100% 0%, rgba(255,42,42,.35), transparent 55%), #070707; display: flex; justify-content: space-between; align-items: end; gap: 24px; flex-wrap: wrap; }
        .group-cta { display: grid; gap: 12px; justify-items: end; }
        .group-cta b { font-size: clamp(22px, 2.4vw, 34px); font-weight: 500; }
        @media (prefers-reduced-motion: reduce) { .pi * { transition: none !important; animation: none !important; } }
      `}</style>
    </div>
  );
}
