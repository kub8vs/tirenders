"use client";

import { SIMULATORS, type SimDef } from "@/config/site";

type Props = {
  free: string[] | null; // null = nie wybrano godziny
  selected: string[];
  onSelect: (id: string) => void;
  price: (s: SimDef) => number | null;
  lang: "pl" | "en";
};

// Plan salonu z góry. Karoserie rysujemy jako sylwetki aut, ringi jako kokpity.
export default function SalonPlan({ free, selected, onSelect, price, lang }: Props) {
  return (
    <div className="plan">
      <svg viewBox="0 0 100 92" role="group" aria-label={lang === "pl" ? "Plan salonu" : "Venue map"}>
        <defs>
          <pattern id="grid" width="4" height="4" patternUnits="userSpaceOnUse">
            <path d="M4 0H0V4" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth=".2" />
          </pattern>
          <radialGradient id="pool" cx="50%" cy="45%" r="60%">
            <stop offset="0" stopColor="rgba(255,255,255,.07)" />
            <stop offset="1" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        <rect x="1" y="1" width="98" height="90" rx="3" fill="#060606" stroke="rgba(255,255,255,.12)" strokeWidth=".3" />
        <rect x="1" y="1" width="98" height="90" rx="3" fill="url(#grid)" />
        <rect x="1" y="1" width="98" height="90" rx="3" fill="url(#pool)" />
        <text x="50" y="49" textAnchor="middle" fontSize="2.4" fill="rgba(255,255,255,.28)" letterSpacing=".6">
          {lang === "pl" ? "STREFA OBSŁUGI" : "PIT WALL"}
        </text>
        <path d="M42 89v-4h16v4" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth=".3" />
        <text x="50" y="87.4" textAnchor="middle" fontSize="1.9" fill="rgba(255,255,255,.4)">
          {lang === "pl" ? "WEJŚCIE" : "ENTRANCE"}
        </text>
        {SIMULATORS.map((s) => {
          const soon = s.status !== "ACTIVE";
          const isFree = !soon && (free === null || free.includes(s.id));
          const isSel = selected.includes(s.id);
          const body = s.priceGroup === "STANDARD";
          const p = price(s);
          return (
            <g
              key={s.id}
              transform={`translate(${s.plan.x} ${s.plan.y}) rotate(${s.plan.r})`}
              className={`rig-node ${isFree ? "free" : "busy"} ${isSel ? "sel" : ""}`}
              role="button"
              tabIndex={isFree ? 0 : -1}
              aria-pressed={isSel}
              aria-disabled={!isFree}
              aria-label={`${s.name}${soon ? (lang === "pl" ? ", wkrótce" : ", coming soon") : isFree ? "" : lang === "pl" ? ", zajęte" : ", taken"}`}
              onClick={() => isFree && onSelect(s.id)}
              onKeyDown={(e) => {
                if (isFree && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(s.id);
                }
              }}
            >
              <rect x="-10" y="-13" width="20" height="26" rx="2" className="hit" />
              {body ? (
                <path d="M-4.6 -9.8c0-1.6 1.4-2.6 4.6-2.6s4.6 1 4.6 2.6l.4 6.8v10.4c0 1.8-1.4 2.8-5 2.8s-5-1-5-2.8V-3z M-3.4 -4.6h6.8l-.6 3.8h-5.6z M-3.4 4.4h6.8l-.4 2.6h-6z" className="shape" />
              ) : (
                <g className="shape">
                  <rect x="-4" y="-9" width="8" height="18" rx="1.6" />
                  <circle cx="0" cy="-5.8" r="2.4" className="wheel" />
                  <rect x="-2.6" y="0" width="5.2" height="6.6" rx="1.4" className="seat" />
                </g>
              )}
              {s.dof && (
                <circle cx="0" cy="0" r="7.6" className="dofring" strokeDasharray={s.dof === 6 ? "1.2 .8" : "2 1.4"} />
              )}
              <g transform={`rotate(${-s.plan.r})`}>
                <text y="16.4" textAnchor="middle" className="lbl">
                  {s.name}
                </text>
                <text y="19.6" textAnchor="middle" className="sub">
                  {soon ? (lang === "pl" ? "wkrótce" : "soon") : isFree ? (p ? `${p} zł` : "") : lang === "pl" ? "zajęte" : "taken"}
                </text>
              </g>
            </g>
          );
        })}
      </svg>
      <style jsx>{`
        .plan { border-radius: 18px; overflow: hidden; border: 1px solid var(--line); background: #030303; }
        svg { display: block; width: 100%; height: auto; font-family: var(--font); }
        :global(.rig-node) { cursor: pointer; outline: none; }
        :global(.rig-node .hit) { fill: transparent; }
        :global(.rig-node .shape), :global(.rig-node .shape rect) { fill: #1c1c1c; stroke: rgba(255,255,255,.35); stroke-width: .3; transition: fill .25s, stroke .25s; }
        :global(.rig-node .wheel) { fill: none; stroke: rgba(255,255,255,.5); stroke-width: .35; }
        :global(.rig-node .shape .seat) { fill: #2a2a2a; }
        :global(.rig-node .dofring) { fill: none; stroke: rgba(255,255,255,.18); stroke-width: .25; }
        :global(.rig-node .lbl) { font-size: 2.3px; fill: #e5e5e5; }
        :global(.rig-node .sub) { font-size: 1.9px; fill: #8a8a8a; }
        :global(.rig-node.free:hover .shape), :global(.rig-node.free:focus-visible .shape), :global(.rig-node.free:hover .shape rect) { stroke: #fff; fill: #2b2b2b; }
        :global(.rig-node.busy) { cursor: not-allowed; opacity: .32; }
        :global(.rig-node.sel .shape), :global(.rig-node.sel .shape rect) { fill: #fff; stroke: #fff; }
        :global(.rig-node.sel .shape .seat) { fill: #bbb; }
        :global(.rig-node.sel .wheel) { stroke: #000; }
        :global(.rig-node.sel .dofring) { stroke: #fff; }
        :global(.rig-node.sel .sub) { fill: #fff; }
        :global(.rig-node:focus-visible .hit) { stroke: #fff; stroke-width: .3; }
      `}</style>
    </div>
  );
}
