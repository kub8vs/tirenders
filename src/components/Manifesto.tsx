"use client";

import { useEffect, useRef } from "react";

// „Ty nie grasz.” zapala się słowo po słowie przy przewijaniu,
// „Ty prowadzisz.” wjeżdża innym, wyścigowym krojem z chromowanym połyskiem jak w logo.
export default function Manifesto({ text, autoplay }: { text: string; autoplay?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const idx = text.indexOf(". ");
  const a = idx > 0 ? text.slice(0, idx + 1) : text;
  const b = idx > 0 ? text.slice(idx + 2) : "";

  useEffect(() => {
    const el = ref.current!;
    const words = Array.from(el.querySelectorAll<HTMLElement>(".w"));
    const race = el.querySelector<HTMLElement>(".race");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      words.forEach((w) => w.classList.add("on"));
      race?.classList.add("on");
      return;
    }
    if (autoplay) {
      const timers = words.map((w, i) => setTimeout(() => w.classList.add("on"), 300 + i * 160));
      timers.push(setTimeout(() => race?.classList.add("on"), 300 + words.length * 160 + 150));
      return () => timers.forEach(clearTimeout);
    }
    let raf = 0;
    const tick = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (vh * 0.5)));
      const n = Math.round(p * (words.length + 1));
      words.forEach((w, i) => w.classList.toggle("on", i < n));
      race?.classList.toggle("on", n > words.length);
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [autoplay]);

  return (
    <h2 ref={ref} className="manifesto" aria-label={text}>
      <span aria-hidden="true">
        {a.split(" ").map((w, i) => (
          <span key={i} className="w">
            {w}&nbsp;
          </span>
        ))}
      </span>
      {b && (
        <span className="race" aria-hidden="true">
          <span className="race-in" data-text={b}>
            {b}
          </span>
        </span>
      )}
    </h2>
  );
}
