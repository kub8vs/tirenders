"use client";

import { useEffect, useRef, useState } from "react";

type Item = { cat: string; q: string; a: string };

const CATS = {
  pl: { all: "Wszystko", start: "Na torze", book: "Rezerwacja i płatność", group: "Grupy i eventy", shop: "Sklep" },
  en: { all: "All", start: "On track", book: "Booking & payment", group: "Groups & events", shop: "Shop" },
};

const L = {
  pl: { driver: "Kierowca", pit: "Boks", channel: "Kanał", live: "Na żywo", pick: "Wybierz pytanie z listy", next: "Następne pytanie" },
  en: { driver: "Driver", pit: "Pit wall", channel: "Channel", live: "Live", pick: "Pick a question from the list", next: "Next question" },
};

function useTyping(text: string, active: boolean) {
  const [typed, setTyped] = useState("");
  const raf = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(raf.current);
    if (!active) return setTyped("");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setTyped(text);
    const start = performance.now();
    const tick = (now: number) => {
      const n = Math.min(text.length, Math.floor((now - start) / 14));
      setTyped(text.slice(0, n));
      if (n < text.length) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [text, active]);
  return typed;
}

function Wave() {
  return (
    <span className="wave" aria-hidden="true">
      {Array.from({ length: 7 }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  );
}

// FAQ jako rozmowa z boksem.
// Komputer: lista pytań po lewej, po prawej przyklejony panel radia, w którym odpowiedź się wpisuje.
// Telefon: czat – pytanie po prawej, odpowiedź wpisuje się pod nim.
export default function FaqRadio({ items, lang }: { items: Item[]; lang: "pl" | "en" }) {
  const t = L[lang];
  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState<number | null>(0);
  const shown = items.map((it, i) => ({ ...it, i })).filter((it) => cat === "all" || it.cat === cat);
  const cats = Object.keys(CATS.pl) as (keyof typeof CATS.pl)[];
  const current = open !== null ? items[open] : null;
  const typed = useTyping(current?.a ?? "", open !== null);

  const choose = (c: string) => {
    setCat(c);
    const first = items.findIndex((it) => c === "all" || it.cat === c);
    setOpen(first >= 0 ? first : null);
  };
  const nextQ = () => {
    if (!shown.length) return;
    const pos = shown.findIndex((s) => s.i === open);
    setOpen(shown[(pos + 1) % shown.length].i);
  };

  return (
    <div className="fr">
      <div className="fr-cats" role="tablist" aria-label="Kategorie">
        {cats.map((c) => (
          <button key={c} type="button" role="tab" aria-selected={cat === c} className={`fr-cat ${cat === c ? "on" : ""}`} onClick={() => choose(c)}>
            {CATS[lang][c]}
          </button>
        ))}
      </div>

      <div className="fr-grid">
        <ol className="fr-list">
          {shown.map((it, n) => {
            const on = open === it.i;
            return (
              <li key={it.i} className={`ex ${on ? "open" : ""}`}>
                <button type="button" className="q" onClick={() => setOpen(on ? null : it.i)} aria-expanded={on}>
                  <span className="qn">{String(n + 1).padStart(2, "0")}</span>
                  <span className="qt">{it.q}</span>
                  <span className="plus" aria-hidden="true">
                    {on ? "–" : "+"}
                  </span>
                </button>
                {on && (
                  <div className="a-inline" role="region">
                    <span className="who">
                      <Wave />
                      {t.pit}
                    </span>
                    <p>
                      <span aria-hidden="true">{typed}</span>
                      {typed.length < it.a.length && <span className="caret" aria-hidden="true" />}
                      <span className="sr-only">{it.a}</span>
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>

        <aside className="radio" aria-live="polite">
          <div className="radio-head">
            <span className="rec" aria-hidden="true" />
            <span>
              {t.channel} 07 · {t.pit} → {t.driver}
            </span>
            <span className="live">{t.live}</span>
          </div>
          {current ? (
            <div className="radio-body" key={open}>
              <span className="who">{t.driver}</span>
              <p className="radio-q">„{current.q}”</p>
              <span className="who red">
                <Wave />
                {t.pit}
              </span>
              <p className="radio-a">
                <span aria-hidden="true">{typed}</span>
                {typed.length < current.a.length && <span className="caret" aria-hidden="true" />}
                <span className="sr-only">{current.a}</span>
              </p>
              <button type="button" className="btn-ghost radio-next" onClick={nextQ}>
                {t.next} →
              </button>
            </div>
          ) : (
            <p className="radio-empty">{t.pick}</p>
          )}
          <div className="scope" aria-hidden="true">
            {Array.from({ length: 48 }, (_, i) => (
              <i key={i} style={{ animationDelay: `${(i % 12) * 0.07}s` }} />
            ))}
          </div>
        </aside>
      </div>

      <style jsx>{`
        .fr { display: grid; gap: 28px; }
        .fr-cats { display: flex; flex-wrap: wrap; gap: 8px; }
        .fr-cat { height: 42px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--line-2); background: transparent; color: #bbb; cursor: pointer; font-size: 14px; transition: all .25s; }
        .fr-cat:hover { color: #fff; border-color: rgba(255,255,255,.35); }
        .fr-cat.on { background: #fff; color: #000; border-color: #fff; }
        .fr-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: clamp(20px, 3vw, 48px); align-items: start; }
        .fr-list { list-style: none; margin: 0; padding: 0; display: grid; border-top: 1px solid var(--line); }
        .q { width: 100%; display: grid; grid-template-columns: 44px 1fr auto; align-items: center; gap: 14px; padding: 22px 6px; background: transparent; border: 0; border-bottom: 1px solid var(--line); color: #bdbdbd; cursor: pointer; font: inherit; text-align: left; transition: color .25s, padding .35s cubic-bezier(.2,.8,.2,1), background .25s; }
        .q:hover { color: #fff; padding-left: 14px; }
        .open .q { color: #fff; padding-left: 14px; background: linear-gradient(90deg, rgba(255,42,42,.14), transparent 70%); border-bottom-color: rgba(255,42,42,.4); }
        .qn { font-size: 12px; letter-spacing: .16em; color: var(--muted); font-variant-numeric: tabular-nums; }
        .open .qn { color: var(--red); }
        .qt { font-size: clamp(17px, 1.45vw, 21px); letter-spacing: -.01em; }
        .plus { font-size: 22px; line-height: 1; color: var(--muted); }
        .a-inline { display: none; }

        .radio { position: sticky; top: 110px; border-radius: 24px; border: 1px solid rgba(255,42,42,.35); background: radial-gradient(120% 90% at 100% 0%, rgba(255,42,42,.2), transparent 55%), #080808; padding: clamp(22px, 2.6vw, 36px); display: grid; gap: 22px; min-height: 440px; overflow: hidden; }
        .radio-head { display: flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); }
        .rec { width: 8px; height: 8px; border-radius: 50%; background: var(--red); box-shadow: 0 0 10px var(--red); animation: blink 1.2s steps(2) infinite; }
        .live { margin-left: auto; color: #ff8a8a; }
        .radio-body { display: grid; gap: 12px; align-content: start; animation: pop .45s cubic-bezier(.16,1,.3,1); }
        .radio-q { font-size: clamp(22px, 2vw, 30px); letter-spacing: -.02em; color: #fff; margin-bottom: 10px; }
        .radio-a { font-size: clamp(17px, 1.35vw, 20px); line-height: 1.55; color: #e9e9e9; min-height: 6.5em; }
        .radio-next { justify-self: start; margin-top: 6px; }
        .radio-empty { color: var(--muted); }
        .scope { display: flex; gap: 3px; align-items: center; height: 34px; margin-top: auto; opacity: .55; }
        .scope i { flex: 1; height: 4px; border-radius: 2px; background: #ff5a5a; animation: wv .9s ease-in-out infinite alternate; }

        .who { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; color: var(--muted); display: flex; align-items: center; gap: 10px; }
        .who.red { color: #ff8a8a; }
        .wave { display: inline-flex; gap: 2px; align-items: center; height: 12px; }
        .wave i { width: 2px; height: 4px; background: #ff5a5a; animation: wv .6s ease-in-out infinite alternate; }
        .wave i:nth-child(2n) { animation-delay: .15s; }
        .wave i:nth-child(3n) { animation-delay: .3s; }
        .caret { display: inline-block; width: 8px; height: 1em; background: #ff5a5a; margin-left: 2px; vertical-align: -2px; animation: blink .7s steps(2) infinite; }
        @keyframes wv { to { height: 12px; } }
        @keyframes blink { 50% { opacity: 0; } }
        @keyframes pop { from { opacity: 0; transform: translateY(10px); } }

        /* telefon: czat zamiast panelu */
        @media (max-width: 900px) {
          .fr-grid { grid-template-columns: minmax(0, 1fr); }
          .radio { display: none; }
          .fr-list { border: 0; gap: 18px; }
          .ex { display: grid; gap: 10px; }
          .q { justify-self: end; width: auto; max-width: 92%; grid-template-columns: 1fr auto; padding: 18px 22px; border-radius: 22px 22px 6px 22px; border: 1px solid var(--line-2); background: #0d0d0d; color: #fff; }
          .q:hover, .open .q { padding-left: 22px; }
          .open .q { background: #fff; color: #000; border-color: #fff; }
          .qn { display: none; }
          .a-inline { display: grid; gap: 8px; max-width: 92%; padding: 18px 22px; border-radius: 22px 22px 22px 6px; border: 1px solid rgba(255,42,42,.5); background: linear-gradient(135deg, rgba(255,42,42,.14), rgba(255,42,42,.02)); animation: pop .45s cubic-bezier(.16,1,.3,1); }
          .a-inline .who { color: #ff8a8a; }
          .a-inline p { color: #e6e6e6; font-size: 16px; }
        }
        @media (prefers-reduced-motion: reduce) { .scope i, .wave i, .rec, .caret { animation: none; } }
      `}</style>
    </div>
  );
}
