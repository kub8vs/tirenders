"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

// „Od kliknięcia do startu”: przy przewijaniu rysuje się linia toru, punkt (Ty) jedzie po niej
// i zapala kolejne punkty kontrolne. Na telefonie pionowa wersja bez przypinania.
const PATH = "M40 300 C 180 300, 220 120, 380 120 S 600 300, 760 260 S 960 80, 1120 120 S 1300 280, 1360 200";

export default function HowTrack({ steps, label }: { steps: string[][]; label: string }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const el = root.current!;
    const path = el.querySelector<SVGPathElement>(".ht-line")!;
    const car = el.querySelector<SVGGElement>(".ht-car")!;
    const cps = Array.from(el.querySelectorAll<SVGGElement>(".ht-cp"));
    const cards = Array.from(el.querySelectorAll<HTMLElement>(".ht-step"));
    const counter = el.querySelector<HTMLElement>(".ht-count b")!;
    const len = path.getTotalLength();
    // punkty kontrolne rozłożone na długości toru
    const at = [0.12, 0.38, 0.64, 0.92];
    cps.forEach((cp, i) => {
      const p = path.getPointAtLength(len * at[i]);
      cp.setAttribute("transform", `translate(${p.x} ${p.y})`);
    });
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 860px)").matches;

    const apply = (p: number) => {
      path.style.strokeDashoffset = `${len * (1 - p)}`;
      const pt = path.getPointAtLength(len * p);
      const pt2 = path.getPointAtLength(Math.min(len, len * p + 1));
      const ang = (Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180) / Math.PI;
      car.setAttribute("transform", `translate(${pt.x} ${pt.y}) rotate(${ang})`);
      let active = -1;
      at.forEach((a, i) => {
        const on = p >= a - 0.01;
        cps[i].classList.toggle("on", on);
        cards[i].classList.toggle("on", on);
        if (on) active = i;
      });
      counter.textContent = String(Math.max(0, active + 1)).padStart(2, "0");
    };

    if (reduced) {
      apply(1);
      return;
    }
    const st = ScrollTrigger.create({
      trigger: el,
      start: mobile ? "top 70%" : "top top",
      end: mobile ? "bottom 60%" : "+=220%",
      pin: !mobile,
      scrub: 0.6,
      onUpdate: (s) => apply(s.progress),
    });
    apply(0);
    return () => st.kill();
  }, []);

  return (
    <div className="ht" ref={root}>
      <div className="ht-inner wrap">
        <div className="ht-count" aria-hidden="true">
          <b>00</b>
          <span>/ 04 · {label}</span>
        </div>
        <svg className="ht-svg" viewBox="0 0 1400 400" aria-hidden="true">
          <path d={PATH} className="ht-base" />
          <path d={PATH} className="ht-kerb" />
          <path d={PATH} className="ht-line" />
          {steps.map((_, i) => (
            <g className="ht-cp" key={i}>
              <circle r="16" />
              <text y="5" textAnchor="middle">
                {i + 1}
              </text>
            </g>
          ))}
          <g className="ht-car">
            <circle r="22" className="glow" />
            <path d="M-14 -7 L12 -7 L18 0 L12 7 L-14 7 Z" />
          </g>
        </svg>
        <ol className="ht-steps">
          {steps.map(([a, b], i) => (
            <li className="ht-step" key={a}>
              <span className="ht-n">0{i + 1}</span>
              <h3>{a}</h3>
              <p>{b}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
