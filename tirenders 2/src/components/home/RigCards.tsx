"use client";

import Link from "next/link";
import { PRICES, SIMULATORS } from "@/config/site";

// Stanowiska jako numery startowe #1–#6. Reflektor podąża za kursorem, numer zapala się na hover.
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
          href={s.status === "ACTIVE" ? `/rezerwacja?sim=${s.id}` : "/oferta"}
          className={`rig-card ${s.status !== "ACTIVE" ? "is-soon" : ""}`}
          onPointerMove={move}
          data-reveal
          data-delay={(i % 3) * 110}
        >
          <span className="rig-num" aria-hidden="true">
            #{i + 1}
          </span>
          <span className="rig-top">
            <span className="rig-tag">{s.dof ? `${s.dof}DOF` : s.priceGroup === "GT3" ? "GT3" : lang === "pl" ? "Karoseria" : "Car body"}</span>
            {s.status !== "ACTIVE" && <span className="rig-tag soon">{soon}</span>}
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
    </div>
  );
}
