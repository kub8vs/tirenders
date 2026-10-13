"use client";

import gsap from "gsap";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/content/dict";
import { COCKPIT, cockpitBox } from "./cockpit";
import type { LightsFrame, LightsScene } from "./lightsScene";

// Kolejność: kokpit BMW M4, za szybą tor i belka → czerwone → pomarańczowe → zielone = start,
// na zegarach rośnie prędkość i biegi → po ~3,5 s kokpit znika, zostaje sam tor
// → logo Tirenders, nawigacja, tło przygasa, przycisk „Zarezerwuj już teraz”.
const LOGO_DELAY = COCKPIT.exitAt + 1;
const GLOW = ["255, 34, 22", "255, 138, 0", "26, 255, 90"];
const REV_SEGMENTS = 10;

export default function Hero({ t }: { t: Dict["hero"] }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cockpit = useRef<HTMLDivElement>(null);
  const scene = useRef<LightsScene | null>(null);
  const [gl, setGl] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const revealRef = useRef<gsap.core.Timeline | null>(null);
  const logoCall = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const el = root.current!;
    const html = document.documentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 820px), (pointer: coarse)").matches;
    const q = gsap.utils.selector(el);
    let disposed = false;
    html.dataset.intro = "on"; // chowa nawigację do momentu pokazania logo

    // zdjęcie kokpitu ułożone jak object-fit: cover, ten sam układ co w scenie WebGL
    const cp = cockpit.current!;
    const box = cp.firstElementChild as HTMLDivElement;
    const layout = () => {
      const b = cockpitBox(el.clientWidth, el.clientHeight);
      box.style.cssText = `left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;--s:${b.s}`;
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(el);

    const ctx = gsap.context(() => {
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
      else logoCall.current = gsap.delayedCall(LOGO_DELAY, () => void revealRef.current?.play());
    };

    // zegary w aucie i kokpit sterowane z pętli sceny, bez re-renderów Reacta
    const glowEl = cp.querySelector<HTMLDivElement>(".cockpit-glow")!;
    const speedEl = cp.querySelector<HTMLElement>(".dash-speed b")!;
    const gearEl = cp.querySelector<HTMLElement>(".dash-gear b")!;
    const revEl = cp.querySelector<HTMLElement>(".dash-rev")!;
    const last = { speed: "", gear: "", rev: -1, op: -1, glow: -1, sig: -1, hidden: false };
    const onFrame = (f: LightsFrame) => {
      const speed = String(Math.round(f.kmh));
      if (speed !== last.speed) speedEl.textContent = last.speed = speed;
      const gear = f.gear === 0 ? "N" : String(f.gear);
      if (gear !== last.gear) {
        gearEl.textContent = last.gear = gear;
        gearEl.parentElement!.classList.remove("shift");
        void gearEl.offsetWidth;
        if (f.gear > 1) gearEl.parentElement!.classList.add("shift");
      }
      const rev = Math.round((Math.min(f.rpm, 8000) / 8000) * REV_SEGMENTS);
      if (rev !== last.rev) revEl.dataset.on = String((last.rev = rev));
      revEl.classList.toggle("limit", f.rpm > 7300);

      const hidden = f.cockpit <= 0.001;
      if (hidden !== last.hidden) cp.style.visibility = (last.hidden = hidden) ? "hidden" : "";
      if (hidden) return;
      const c = f.cockpit;
      const out = 1 - c;
      const op = Math.min(f.fade * 1.4, 1) * Math.min(1, c * 2.2);
      if (Math.abs(op - last.op) > 0.002) cp.style.opacity = String((last.op = op));
      // start: auto przysiada i drży; wyjście: przelot przez szybę
      const j = f.shake * (mobile ? 1.2 : 2);
      const jx = (Math.random() - 0.5) * j;
      const jy = (Math.random() - 0.5) * j;
      box.style.transform = `translate3d(${jx}px, ${jy}px, 0) scale(${1 + out * out * 0.9})`;
      if (f.signal !== last.sig) glowEl.style.setProperty("--glow", GLOW[(last.sig = f.signal)]);
      if (Math.abs(f.glow - last.glow) > 0.004) glowEl.style.opacity = String((last.glow = f.glow) * 0.85);
    };

    (async () => {
      try {
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no webgl2");
        const img = cp.querySelector("img")!;
        const ready = img.decode().catch(() => undefined);
        const [{ LightsScene }] = await Promise.all([import("./lightsScene"), Promise.race([ready, new Promise((r) => setTimeout(r, 2500))])]);
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
      ro.disconnect();
      logoCall.current?.kill();
      ctx.revert();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  const skip = () => {
    scene.current?.skip();
    logoCall.current?.kill();
    revealRef.current?.progress(1);
  };

  return (
    <section ref={root} className={`hero ${gl ? "" : "no-gl"}`} aria-label="Intro">
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />

      <div ref={cockpit} className="cockpit" aria-hidden="true">
        <div className="cockpit-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COCKPIT.src} alt="" width={COCKPIT.w} height={COCKPIT.h} fetchPriority="high" draggable={false} />
          <div className="cockpit-glow" />
          <div className="dash">
            <div className="dash-speed">
              <b>0</b>
              <small>km/h</small>
            </div>
            <div className="dash-rev" data-on="0">
              {Array.from({ length: REV_SEGMENTS }, (_, i) => (
                <i key={i} />
              ))}
            </div>
            <div className="dash-gear">
              <b>N</b>
            </div>
          </div>
        </div>
      </div>

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
