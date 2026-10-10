"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

/*
  Wspólne animacje całej strony (uruchamiane na każdej podstronie):
  [data-split]      nagłówek wjeżdża słowo po słowie spod maski
  [data-parallax=k] element przesuwa się wolniej/szybciej przy przewijaniu
  [data-count]      liczba odlicza od zera, gdy wjedzie w kadr
  .magnetic         przycisk lekko podąża za kursorem
  .progress-bar     czerwony pasek postępu przewijania u góry
*/
export default function Motion() {
  const path = usePathname();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    const ctx = gsap.context(() => {
      // nagłówki z <Split>: słowa wyjeżdżają spod maski
      if (!reduced)
        document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
          gsap.from(el.querySelectorAll(".swi"), {
            yPercent: 115,
            rotate: 4,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.06,
            scrollTrigger: { trigger: el, start: "top 88%" },
          });
        });

      if (!reduced)
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          const k = Number(el.dataset.parallax || 0.15);
          gsap.fromTo(el, { yPercent: -k * 100 }, { yPercent: k * 100, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });

      document.querySelectorAll<HTMLElement>("[data-count]:not(.cluster [data-count])").forEach((el) => {
        const target = Number(el.dataset.count);
        if (!Number.isFinite(target)) return;
        const suffix = el.dataset.suffix ?? "";
        const o = { v: 0 };
        if (reduced) return;
        el.textContent = "0" + suffix;
        gsap.to(o, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 90%" },
          onUpdate: () => {
            el.textContent = Math.round(o.v) + suffix;
          },
        });
      });
    });

    // przyciski magnetyczne
    if (!reduced && window.matchMedia("(pointer: fine)").matches)
      document.querySelectorAll<HTMLElement>(".magnetic").forEach((el) => {
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = e.clientX - (r.left + r.width / 2);
          const y = e.clientY - (r.top + r.height / 2);
          gsap.to(el, { x: x * 0.25, y: y * 0.35, duration: 0.4, ease: "power3.out" });
        };
        const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });

    // pasek postępu
    const bar = document.querySelector<HTMLElement>(".progress-bar");
    const onScroll = () => {
      if (!bar) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const t = setTimeout(() => ScrollTrigger.refresh(), 400);

    return () => {
      clearTimeout(t);
      window.removeEventListener("scroll", onScroll);
      cleanups.forEach((f) => f());
      ctx.revert();
    };
  }, [path]);

  return <div className="progress-bar" aria-hidden="true" />;
}
