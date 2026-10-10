"use client";

import { useEffect, useRef } from "react";

// Trzy informacje o symulatorach jako sektory z ekranu pomiaru czasu (S1 S2 S3, najszybszy na fioletowo).
export default function SectorStrip({ specs }: { specs: string[][] }) {
  const ref = useRef<HTMLUListElement>(null);
  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <ul className="sectors" ref={ref}>
      {specs.map(([s, value, unit, desc], i) => {
        const m = value.match(/^(\d+)(\D*)$/);
        return (
          <li className="sector" key={s}>
            <span className={`sector-bar ${i === 2 ? "best" : ""}`}>
              <i />
            </span>
            <span className="sector-id">{s}</span>
            <span className="sector-value">
              <b data-count={m ? m[1] : undefined} data-suffix={m ? m[2] : undefined}>
                {value}
              </b>
              <small>{unit}</small>
            </span>
            <span className="sector-desc">{desc}</span>
          </li>
        );
      })}
    </ul>
  );
}
