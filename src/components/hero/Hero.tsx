"use client";

import gsap from "gsap";
import Cta from "@/components/Cta";
import Link from "next/link";
import Rich from "@/components/Rich";
import { useEffect, useRef, useState } from "react";
import type { Dict } from "@/content/dict";
import { COCKPIT, cockpitBox } from "./cockpit";
import type { LightsFrame, LightsScene } from "./lightsScene";

// Najpierw film z nagrań klienta w symulatorze: siadasz, stopa na pedale, odpalenie (zegary),
// kierownica, ruszasz i kamera płynnie najeżdża na monitor. Ostatnia klatka przechodzi w zapętlone
// tło z tej samej gry (ten sam kadr), więc nie widać szwu; na nim pojawia się logo.
// Bez filmu (ograniczony ruch, oszczędzanie danych, brak autoodtwarzania) zostaje dawne intro:
// kokpit BMW M4, za szybą tor i belka → czerwone → pomarańczowe → zielone = start,
// na zegarach rośnie prędkość i biegi → po ~3,5 s kokpit znika, zostaje sam tor
// → logo Tirenders, nawigacja, tło przygasa, przycisk „Zarezerwuj już teraz”.
const LOGO_DELAY = COCKPIT.exitAt + 1;
const GLOW = ["255, 34, 22", "255, 138, 0", "26, 255, 90"];
const REV_SEGMENTS = 10;
// cięcia w /video/intro.mp4 (s): kokpit, pedał, odpalenie, kierownica, ruszasz + najazd na monitor
const FILM = { src: "/video/intro.mp4", srcM: "/video/intro-m.mp4", bg: "/video/intro-bg.mp4", bgM: "/video/intro-bg-m.mp4", cuts: [0, 2.0, 3.714, 5.964, 7.75], end: 11.75 };

export default function Hero({ t }: { t: Dict["hero"] }) {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cockpit = useRef<HTMLDivElement>(null);
  const scene = useRef<LightsScene | null>(null);
  const [gl, setGl] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const [film, setFilm] = useState(true);
  const endFilmRef = useRef<(() => void) | null>(null);
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
    const dims = { w: 1, h: 1 };
    const layout = () => {
      const b = cockpitBox(el.clientWidth, el.clientHeight);
      dims.w = b.w;
      dims.h = b.h;
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
        .add(() => el.querySelector(".hero-go")?.classList.add("go"), 1.1)
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
    const lampL = cp.querySelector<HTMLElement>(".lamp-l")!;
    const lampR = cp.querySelector<HTMLElement>(".lamp-r")!;
    const streaks = cp.querySelector<HTMLElement>(".side-streaks")!;
    const flash = cp.querySelector<HTMLElement>(".side-flash")!;
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
      // drgania auta (płynne, te same częstotliwości co kamera), przeciążenie wciska głowę w fotel,
      // przy zmianie biegu głowa leci do przodu; wyjście: przelot przez szybę
      const j = f.vib * (mobile ? 1.6 : 2.6);
      const jx = (Math.sin(f.t * 41) + Math.sin(f.t * 27.3)) * 0.5 * j;
      const jy = (Math.sin(f.t * 33.7) + Math.sin(f.t * 52.1)) * 0.5 * j + f.g * dims.h * 0.008;
      box.style.transform = `translate3d(${jx.toFixed(2)}px, ${jy.toFixed(2)}px, 0) scale(${(1 + out * out * 0.9 - f.g * 0.028).toFixed(4)})`;
      // lampy toru: plama światła wpada przez szybę i zjeżdża z deski na kierownicę
      const lamp = (node: HTMLElement, i: number, p: number, x0: number, x1: number) => {
        node.style.opacity = (i * 0.9).toFixed(3);
        node.style.transform = `translate3d(${(dims.w * (x0 + (x1 - x0) * p)).toFixed(1)}px, ${(dims.h * (0.3 + 0.32 * p)).toFixed(1)}px, 0)`;
      };
      lamp(lampL, f.lampL, f.lampLp, 0.36, 0.2);
      lamp(lampR, f.lampR, f.lampRp, 0.62, 0.8);
      // boczna szyba: mijane lampy i smugi diod na barierze
      const speedK = Math.min(1, f.kmh / 160);
      streaks.style.opacity = (speedK * 0.6).toFixed(3);
      streaks.style.transform = `translate3d(${(-((f.travel * dims.w * 0.012) % (dims.w * 0.12))).toFixed(1)}px, 0, 0)`;
      flash.style.opacity = (f.sideI * Math.min(1, f.kmh / 40) * 0.8).toFixed(3);
      flash.style.transform = `translate3d(${(dims.w * (0.25 - 0.3 * f.sideP)).toFixed(1)}px, 0, 0) scaleX(${(1 + speedK * 2.5).toFixed(2)})`;
      if (f.signal !== last.sig) glowEl.style.setProperty("--glow", GLOW[(last.sig = f.signal)]);
      if (Math.abs(f.glow - last.glow) > 0.004) glowEl.style.opacity = String((last.glow = f.glow) * 0.85);
    };

    const startScene = async () => {
      try {
        if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no webgl2");
        const img = cp.querySelector<HTMLImageElement>(`img[src="${COCKPIT.src}"]`)!;
        const ready = img.decode().catch(() => undefined);
        const [{ LightsScene }] = await Promise.all([import("./lightsScene"), Promise.race([ready, new Promise((r) => setTimeout(r, 2500))])]);
        if (disposed) return;
        scene.current = new LightsScene(canvas.current!, { mobile, reducedMotion: reduced, onLaunch: launch, onFrame });
      } catch {
        setGl(false);
        revealRef.current?.progress(1);
      }
    };

    // ---------- film: odpalenie, start i najazd na monitor ----------
    const video = el.querySelector<HTMLVideoElement>(".hero-film");
    const bgVideo = el.querySelector<HTMLVideoElement>(".hero-bg")!;
    let bgStarted = false;
    const startBg = () => {
      if (bgStarted) return;
      bgStarted = true;
      bgVideo.currentTime = 0;
      void bgVideo.play().catch(() => undefined);
    };
    // tło gra tylko, gdy hero jest na ekranie
    const io = new IntersectionObserver(([e]) => {
      if (!bgStarted) return;
      if (e.isIntersecting) void bgVideo.play().catch(() => undefined);
      else bgVideo.pause();
    });
    io.observe(el);
    const save = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
    let filmOn = !!video && !reduced && !save;
    let raf = 0;
    let wait: ReturnType<typeof setTimeout> | undefined;
    const hud = el.querySelector<HTMLElement>(".film-hud");
    const capNum = hud?.querySelector<HTMLElement>(".film-num");
    const capTxt = hud?.querySelector<HTMLElement>(".film-step");
    const bar = hud?.querySelector<HTMLElement>(".film-bar i");
    let lastStep = -1;
    const tick = () => {
      if (!filmOn || !video || !hud) return;
      const ft = video.currentTime;
      let step = 0;
      FILM.cuts.forEach((c, i) => ft >= c && (step = i));
      if (step !== lastStep) {
        lastStep = step;
        hud.dataset.step = String(step);
        capNum!.textContent = `0${step + 1}`;
        capTxt!.textContent = t.film[step];
        capTxt!.parentElement!.classList.remove("swap");
        void capTxt!.offsetWidth;
        capTxt!.parentElement!.classList.add("swap");
      }
      bar!.style.transform = `scaleX(${Math.min(1, ft / FILM.end).toFixed(3)})`;
      if (ft >= FILM.end + 0.2) return endFilm(); // gdyby "ended" nie przyszło
      raf = requestAnimationFrame(tick);
    };
    const endFilm = () => {
      if (!filmOn) return;
      filmOn = false;
      cancelAnimationFrame(raf);
      clearTimeout(wait);
      // film stoi na ostatniej klatce, tło z gry rusza dokładnie od następnej i dopiero wtedy przenikamy
      let shown = false;
      const show = () => {
        if (shown || disposed) return;
        shown = true;
        el.classList.add("film-out", "bg-on");
        logoCall.current = gsap.delayedCall(0.35, () => void revealRef.current?.play());
      };
      bgVideo.addEventListener("playing", show, { once: true });
      setTimeout(show, 400);
      startBg();
      setTimeout(() => {
        video?.pause();
        if (!disposed) setFilm(false);
      }, 900);
    };
    const noFilm = () => {
      if (!filmOn) return;
      filmOn = false;
      clearTimeout(wait);
      setFilm(false);
      void startScene();
    };
    endFilmRef.current = endFilm;
    if (filmOn && video) {
      const mp4 = video.canPlayType('video/mp4; codecs="avc1.640028"') !== "";
      const src = mobile ? FILM.srcM : FILM.src;
      video.src = mp4 ? src : src.replace(".mp4", ".webm");
      const bgSrc = mobile ? FILM.bgM : FILM.bg;
      bgVideo.src = mp4 ? bgSrc : bgSrc.replace(".mp4", ".webm");
      bgVideo.load();
      video.addEventListener("ended", endFilm);
      video.addEventListener("error", noFilm);
      video.addEventListener("playing", () => {
        clearTimeout(wait);
        el.classList.add("film-on");
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(tick);
      });
      // słabe łącze: jeśli film nie ruszy w 5 s, pokazujemy dawne intro
      wait = setTimeout(noFilm, 5000);
      video.play().catch(noFilm);
    } else {
      setFilm(false);
      void startScene();
    }

    return () => {
      disposed = true;
      filmOn = false;
      cancelAnimationFrame(raf);
      clearTimeout(wait);
      html.dataset.intro = "off";
      ro.disconnect();
      io.disconnect();
      logoCall.current?.kill();
      ctx.revert();
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  const skip = () => {
    endFilmRef.current?.();
    scene.current?.skip();
    logoCall.current?.kill();
    revealRef.current?.progress(1);
  };

  return (
    <section ref={root} className={`hero ${gl ? "" : "no-gl"}`} aria-label="Intro">
      <canvas ref={canvas} className="hero-canvas" aria-hidden="true" />
      <video className="hero-bg" muted playsInline loop preload="auto" aria-hidden="true" />

      <div ref={cockpit} className="cockpit" aria-hidden="true">
        <div className="cockpit-box">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="cockpit-glass" src="/img/kokpit-szyba.webp" alt="" width={COCKPIT.w} height={COCKPIT.h} draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={COCKPIT.src} alt="" width={COCKPIT.w} height={COCKPIT.h} fetchPriority="high" draggable={false} />
          <div className="cockpit-light">
            <div className="cockpit-glow" />
            <i className="lamp lamp-l" />
            <i className="lamp lamp-r" />
          </div>
          <div className="cockpit-side">
            <i className="side-streaks" />
            <i className="side-flash" />
          </div>
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

      {film && (
        <>
          <video className="hero-film" muted playsInline preload="auto" aria-hidden="true" />
          <div className="film-hud" aria-hidden="true">
            <div className="film-cap">
              <span className="film-num">01</span>
              <b className="film-step">{t.film[0]}</b>
              <i className="film-bar">
                <i />
              </i>
            </div>
          </div>
        </>
      )}

      <div className="hero-dim" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />

      <div className="hero-ui">
        <h1 className="sr-only">{t.srTitle}</h1>

        <div className="hero-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-logo" src="/img/2real-logo.webp" alt="2Real Simracing by Tirenders" width={1109} height={384} />
          <div className="tagline">
            <p className="tagline-main">
              <Rich text={t.tagline} />
            </p>
            <p className="tagline-meta">
              {t.taglineMeta.map((m) => (
                <span key={m}>{m}</span>
              ))}
            </p>
          </div>
          <div className="hero-cta">
            <Link href="/rezerwacja" className="hero-go magnetic">
              <span className="go-lights" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="go-txt">
                <b>{t.cta}</b>
                <small>{t.ctaSub}</small>
              </span>
              <span className="go-arrow" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M5 12h13M13 6l6 6-6 6" />
                </svg>
              </span>
            </Link>
            <Cta href="/oferta" ghost className="hero-cta2">
              {t.cta2}
            </Cta>
          </div>
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
