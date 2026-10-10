"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";

// Zegary jak w aucie: obrotomierz (0–8 tys. obr/min, czerwone pole od 7) i prędkościomierz (0–320 km/h).
// Wskazówki aktualizowane z pętli sceny przez ref, bez re-renderów Reacta.

export type ClusterHandle = { set: (kmh: number, gear: number, rpm: number, lit: number, signal: number) => void };

const START = 225; // stopnie: 0 jednostek
const SWEEP = 270;

function polar(r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)];
}
function arc(r: number, from: number, to: number) {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  const large = Math.abs(to - from) > 180 ? 1 : 0;
  return `M${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

function Dial({ max, major, minor, red, label, unit, children, needleRef }: { max: number; major: number; minor: number; red?: number; label: (v: number) => string; unit: string; children: React.ReactNode; needleRef: React.RefObject<SVGGElement> }) {
  const ang = (v: number) => START - 360 + (v / max) * SWEEP; // -135 … 135
  const ticks = [];
  for (let v = 0; v <= max + 1e-6; v += minor) {
    const isMajor = Math.abs(v / major - Math.round(v / major)) < 1e-6;
    const a = ang(v);
    const [x1, y1] = polar(isMajor ? 80 : 84, a);
    const [x2, y2] = polar(90, a);
    ticks.push(<line key={`t${v}`} x1={x1} y1={y1} x2={x2} y2={y2} className={`${isMajor ? "maj" : "min"} ${red !== undefined && v >= red ? "red" : ""}`} />);
    if (isMajor) {
      const [lx, ly] = polar(67, a);
      ticks.push(
        <text key={`l${v}`} x={lx} y={ly + 3.5} textAnchor="middle" className={red !== undefined && v >= red ? "red" : ""}>
          {label(v)}
        </text>,
      );
    }
  }
  return (
    <svg viewBox="0 0 200 200" className="dial">
      <circle cx="100" cy="100" r="96" className="face" />
      <path d={arc(90, -135, 135)} className="track" />
      {red !== undefined && <path d={arc(88, ang(red), 135)} className="redzone" />}
      {ticks}
      <text x="100" y="152" textAnchor="middle" className="unit">
        {unit}
      </text>
      {children}
      <g ref={needleRef} className="needle" style={{ transform: "rotate(-135deg)", transformOrigin: "100px 100px" }}>
        <path d="M98.4 104 L99.4 22 L100.6 22 L101.6 104 Z" />
      </g>
      <circle cx="100" cy="100" r="7" className="hub" />
    </svg>
  );
}

const Cluster = forwardRef<ClusterHandle, { gearLabel: string }>(function Cluster({ gearLabel }, ref) {
  const tach = useRef<SVGGElement>(null);
  const speedo = useRef<SVGGElement>(null);
  const gearEl = useRef<SVGTextElement>(null);
  const speedEl = useRef<SVGTextElement>(null);
  const lamps = useRef<HTMLDivElement>(null);
  const signalEl = useRef<HTMLDivElement>(null);
  const last = useRef({ lit: -1, sig: -1 });

  useImperativeHandle(ref, () => ({
    set(kmh, gear, rpm, lit, signal) {
      const r = Math.max(0, Math.min(8000, rpm));
      if (tach.current) tach.current.style.transform = `rotate(${-135 + (r / 8000) * SWEEP}deg)`;
      if (speedo.current) speedo.current.style.transform = `rotate(${-135 + (Math.min(kmh, 320) / 320) * SWEEP}deg)`;
      if (gearEl.current) gearEl.current.textContent = gear === 0 ? "N" : String(gear);
      if (speedEl.current) speedEl.current.textContent = String(Math.round(kmh));
      if (lamps.current && (last.current.lit !== lit || last.current.sig !== signal)) {
        last.current = { lit, sig: signal };
        lamps.current.dataset.lit = String(lit);
        lamps.current.dataset.sig = String(signal);
        if (signalEl.current) signalEl.current.dataset.on = lit === 0 ? "" : ["red", "amber", "green"][signal];
      }
    },
  }));

  return (
    <div className="cluster" aria-hidden="true">
      <Dial max={8} major={1} minor={0.5} red={7} label={(v) => String(v)} unit="×1000 rpm" needleRef={tach}>
        <text ref={gearEl} x="100" y="132" textAnchor="middle" className="big">
          N
        </text>
        <text x="100" y="140" textAnchor="middle" className="cap">
          {gearLabel}
        </text>
      </Dial>
      <div className="cluster-mid">
        <div className="lamps" ref={lamps} data-lit="0" data-sig="0">
          <i />
          <i />
          <i />
          <i />
          <i />
        </div>
        <div className="signal" ref={signalEl}>
          <span className="s-red" />
          <span className="s-amber" />
          <span className="s-green" />
        </div>
      </div>
      <Dial max={320} major={40} minor={20} label={(v) => String(v)} unit="km/h" needleRef={speedo}>
        <text ref={speedEl} x="100" y="132" textAnchor="middle" className="big">
          0
        </text>
      </Dial>
    </div>
  );
});

export default Cluster;
