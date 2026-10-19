"use client";

import { useEffect, useRef, useState } from "react";

type Res = { result: string; code?: string; name?: string; sim?: string; when?: string; duration?: number; status?: string };
const LABEL: Record<string, string> = { ok: "Wpuszczony", already: "Już był check-in", not_found: "Nie ma takiego kodu", not_paid: "Rezerwacja nieopłacona / nieaktywna", too_early: "Za wcześnie (ponad 2 h do startu)" };

// Skaner QR: BarcodeDetector tam, gdzie jest (Chrome na Androidzie), a na iPhonie i w Safari biblioteka jsQR.
export default function CheckIn() {
  const video = useRef<HTMLVideoElement>(null);
  const [code, setCode] = useState("");
  const [res, setRes] = useState<Res | null>(null);
  const [scan, setScan] = useState(false);
  const [support, setSupport] = useState(true);
  const last = useRef("");

  const send = async (c: string) => {
    const r = await fetch("/api/admin/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
    setRes(await r.json());
  };

  useEffect(() => {
    if (!scan) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setSupport(false);
      setScan(false);
      return;
    }
    let stream: MediaStream | null = null;
    let timer = 0;
    let stopped = false;
    const BD = (window as unknown as { BarcodeDetector?: new (o: object) => { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    (async () => {
      const jsQR = BD ? null : (await import("jsqr")).default;
      const det = BD ? new BD({ formats: ["qr_code"] }) : null;
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (stopped) return stream.getTracks().forEach((t) => t.stop());
      video.current!.srcObject = stream;
      await video.current!.play();
      const read = async () => {
        const v = video.current;
        if (!v || !v.videoWidth) return null;
        if (det) return (await det.detect(v))[0]?.rawValue ?? null;
        // jsQR: zmniejszona klatka (maks. 640 px) wystarczy i nie grzeje telefonu
        const k = Math.min(1, 640 / v.videoWidth);
        canvas.width = Math.round(v.videoWidth * k);
        canvas.height = Math.round(v.videoHeight * k);
        ctx!.drawImage(v, 0, 0, canvas.width, canvas.height);
        const img = ctx!.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR!(img.data, img.width, img.height, { inversionAttempts: "dontInvert" })?.data ?? null;
      };
      const loop = async () => {
        if (stopped) return;
        try {
          const v = await read();
          if (v && v !== last.current) {
            last.current = v;
            if (navigator.vibrate) navigator.vibrate(80);
            send(v);
          }
        } catch {}
        timer = window.setTimeout(loop, 150);
      };
      loop();
    })().catch(() => setScan(false));
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [scan]);

  return (
    <div style={{ display: "grid", gap: 20, maxWidth: 620 }}>
      <form onSubmit={(e) => { e.preventDefault(); send(code); }} style={{ display: "flex", gap: 8 }}>
        <input className="input" placeholder="Kod rezerwacji, np. K7P2QX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoFocus aria-label="Kod rezerwacji" />
        <button className="btn-white" type="submit" disabled={code.length < 4}>Sprawdź</button>
      </form>
      <div>
        <button className="btn-ghost" type="button" onClick={() => setScan(!scan)}>{scan ? "Zatrzymaj skaner" : "Skanuj QR kamerą"}</button>
        {!support && <p className="err" style={{ marginTop: 10 }}>Ta przeglądarka nie daje dostępu do aparatu. Otwórz panel w Safari albo Chrome albo wpisz kod.</p>}
      </div>
      {scan && <video ref={video} muted playsInline style={{ width: "100%", borderRadius: 14, border: "1px solid var(--line)" }} />}
      {res && (
        <div className="glass" style={{ padding: 22, borderColor: res.result === "ok" ? "rgba(61,220,132,.6)" : "rgba(255,42,42,.4)" }} role="status">
          <b style={{ fontSize: 26, fontWeight: 500, color: res.result === "ok" ? "#9ff0c0" : "#ff9a9a" }}>{LABEL[res.result] ?? res.result}</b>
          {res.name && (
            <p style={{ marginTop: 10, color: "#ccc" }}>
              {res.name} · {res.sim} · {res.duration} min<br />
              {res.when} · {res.code}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
