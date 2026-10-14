"use client";

import Link from "next/link";
import { PRICES, SIMULATORS } from "@/config/site";

// Stanowiska jako numery startowe #1–#7. Reflektor podąża za kursorem, numer zapala się na hover.
// Kafelek prowadzi do opisu stanowiska (/oferta/[id]); stamtąd dopiero do rezerwacji.
export default function RigCards({ lang, soon, from }: { lang: "pl" | "en"; soon: string; from: string }) {
  const move = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div className="rig-grid">
      {SIMULATORS.map((s, i) => (
        <Link
          key={s.id}
          href={`/oferta/${s.id}`}
          className={`rig-card ${s.status !== "ACTIVE" ? "is-soon" : ""}`}
          onPointerMove={move}
          data-reveal
          data-delay={(i % 4) * 90}
        >
          <span className="rig-num" aria-hidden="true">
            #{i + 1}
          </span>
          <span className="rig-top">
            {s.status !== "ACTIVE" ? (
              <span className="rig-tag soon">{soon}</span>
            ) : (
              <span className="rig-tag">{s.dof ? `${s.dof}DOF` : s.priceGroup === "GT3" ? "GT3" : lang === "pl" ? "Karoseria" : "Car body"}</span>
            )}
          </span>
          <span className="rig-body">
            <b>{s.name}</b>
            <span>{s.body[lang]}</span>
          </span>
          <span className="rig-foot">
            <span>15–90 min</span>
            <span>
              {from} <b>{PRICES[s.priceGroup][15]} zł</b>
            </span>
            <span className="rig-arrow" aria-hidden="true">→</span>
          </span>
        </Link>
      ))}
      <Link href="/oferta/individual" className="rig-card rig-individual" onPointerMove={move} data-reveal data-delay={(SIMULATORS.length % 4) * 90}>
        <span className="rig-num" aria-hidden="true">
          #∞
        </span>
        <span className="rig-top">
          <span className="rig-tag">{lang === "pl" ? "Na miarę" : "Tailor-made"}</span>
        </span>
        <span className="rig-body">
          <b>Individual</b>
          <span>{lang === "pl" ? "Oferta szyta pod Ciebie: grupy, eventy, treningi. Szczegóły ustalamy razem." : "An offer built around you: groups, events, coaching. We work out the details together."}</span>
        </span>
        <span className="rig-foot">
          <span>{lang === "pl" ? "Indywidualnie" : "Custom"}</span>
          <span className="rig-arrow" aria-hidden="true">→</span>
        </span>
      </Link>
    </div>
  );
}
