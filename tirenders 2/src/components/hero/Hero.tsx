"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/content/dict";
import Cluster, { type ClusterHandle } from "./Cluster";
import type { LightsScene } from "./lightsScene";

// Kolejność: tylko droga, belka i zegary auta → czerwone → żółte → zielone = start
// → ~2 s jazdy → logo Tirenders, nawigacja, tło przygasa, przycisk „Zarezerwuj już teraz”.
const LOGO_DELAY = 2;

export default function Hero({ t }: { t: Dict["hero"] }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cluster = useRef<ClusterHandle>(null);
  const scene = useRef<LightsScene | null>(null);
  const [gl, setGl] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const revealRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    const q = gsap.utils.selector(el);
    let disposed = false;
    html.dataset.intro = "on"; // chowa nawigację do momentu pokazania logo

    const ctx = gsap.context(() => {
      gsap.from(q(".cluster"), { opacity: 0, y: 40, duration: 1.1, ease: "power3.out", delay: 0.25 });
      const reveal = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.out" },
        onStart: () => {
          setRevealed(true);
          html.dataset.intro = "off";
        },
      });
      reveal
        .fromTo(q(".hero-logo"), { opacity: 0, scale: 0.86, filter: "blur(22px) brightness(2.2)" }, { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)", duration: 1.3, ease: "expo.out" }, 0)
        .add(() => el.querySelector(".hero-logo")?.classList.add("shine"), 0.5)
        .fromTo(q(".hero-dim"), { opacity: 0 }, { opacity: 1, duration: 1.4, ease: "power2.inOut" }, 0.35)
        .fromTo(q(".tagline"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 0.8)
        .fromTo(q(".hero-cta"), { opacity: 0, y: 20, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.9 }, 0.95)
        .fromTo(q(".scroll-cue"), { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: 0.8 }, 1.6);
      revealRef.current = reveal;
    }, el);

    const launch = () => {
      if (reduced) revealRef.current?.progress(1);
      else revealRef.current?.delay(LOGO_DELAY).play();
    };
    const onFrame = (kmh: number, gear: number, rpm: number, lit: number, signal: number) => cluster.current?.set(kmh, gear, rpm, lit, signal);

    (async () => {
      try {
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no webgl2");
        const { LightsScene } = await import("./lightsScene");
        if (disposed) return;
        scene.current = new LightsScene(canvas.current!, { mobile, reducedMotion: reduced, onLaunch: launch, onFrame });
      } catch {
        setGl(false);
        revealRef.current?.progress(1);
      }
    })();

    return () => {
      disposed = true;
      html.dataset.intro = "off";
      ctx.revert();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  const skip = () => {
    scene.current?.skip();
    revealRef.current?.delay(0).progress(1);
  };

  return (
    <section ref={root} className={`hero ${gl ? "" : "no-gl"}`} aria-label="Intro">
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <div className="hero-dim" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-ui">
        <h1 className="sr-only">{t.srTitle}</h1>

        <div className="hero-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo" src="/img/tirenders-logo.webp" alt="Tirenders" width={1400} height={796} />
          <p className="tagline">{t.tagline}</p>
          <Link href="/rezerwacja" className="hero-cta btn-white magnetic">
            {t.cta}
          </Link>
        </div>

        <Cluster ref={cluster} gearLabel={t.gear} />

        {gl && !revealed && (
          <button type="button" className="chip hero-skip" onClick={skip}>
            {t.skip}
          </button>
        )}

        <a href="#start" className="scroll-cue" aria-label={t.scroll}>
          <span className="mouse" aria-hidden="true">
            <i />
          </span>
          <span>{t.scroll}</span>
        </a>
      </div>
    </section>
  );
}
