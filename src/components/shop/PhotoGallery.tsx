"use client";

import { useCallback, useEffect, useState } from "react";

// Galeria zdjęć w układzie „cegiełek” z podglądem na pełnym ekranie (strzałki, Esc, klik w tło).
export default function PhotoGallery({ photos, label }: { photos: { src: string; alt: string }[]; label: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + photos.length) % photos.length)), [photos.length]);
  useEffect(() => {
    if (open === null) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  return (
    <>
      <div className="pg">
        {photos.map((p, i) => (
          <button type="button" key={p.src} className="pg-item" onClick={() => setOpen(i)} aria-label={`${label}: ${p.alt}`} data-reveal data-delay={(i % 4) * 80}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.alt} loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="lb" role="dialog" aria-modal="true" aria-label={photos[open].alt} onClick={close}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photos[open].src} alt={photos[open].alt} onClick={(e) => e.stopPropagation()} />
          <button type="button" className="lb-btn prev" onClick={(e) => (e.stopPropagation(), step(-1))} aria-label="Poprzednie">←</button>
          <button type="button" className="lb-btn next" onClick={(e) => (e.stopPropagation(), step(1))} aria-label="Następne">→</button>
          <button type="button" className="lb-btn close" onClick={close} aria-label="Zamknij">✕</button>
          <span className="lb-count">{open + 1} / {photos.length}</span>
        </div>
      )}
      <style jsx>{`
        .pg { columns: 3 260px; column-gap: 12px; }
        .pg-item { display: block; width: 100%; margin: 0 0 12px; padding: 0; border: 0; border-radius: 16px; overflow: hidden; cursor: zoom-in; background: #0b0b0b; break-inside: avoid; position: relative; }
        .pg-item img { width: 100%; height: auto; display: block; transition: transform .9s cubic-bezier(.2,.8,.2,1), filter .5s; }
        .pg-item::after { content: "+"; position: absolute; right: 12px; bottom: 12px; width: 36px; height: 36px; border-radius: 50%; background: #fff; color: #000; display: grid; place-items: center; font-size: 20px; transform: scale(0); transition: transform .35s cubic-bezier(.2,.8,.2,1); }
        .pg-item:hover img { transform: scale(1.06); }
        .pg-item:hover::after { transform: scale(1); }
        .lb { position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,.94); display: grid; place-items: center; padding: 60px 70px; animation: lbIn .3s ease; }
        @keyframes lbIn { from { opacity: 0; } }
        .lb img { max-width: 100%; max-height: 100%; border-radius: 14px; animation: lbImg .45s cubic-bezier(.16,1,.3,1); }
        @keyframes lbImg { from { transform: scale(.94); opacity: 0; } }
        .lb-btn { position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 1px solid var(--line-2); background: rgba(20,20,20,.8); color: #fff; font-size: 18px; cursor: pointer; }
        .lb-btn.prev { left: 14px; top: 50%; }
        .lb-btn.next { right: 14px; top: 50%; }
        .lb-btn.close { right: 14px; top: 14px; }
        .lb-count { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); color: var(--muted); font-size: 13px; letter-spacing: .14em; }
      `}</style>
    </>
  );
}
