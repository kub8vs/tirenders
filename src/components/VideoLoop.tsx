"use client";

import { useEffect, useRef } from "react";
import type { Clip } from "@/config/media";

// Pętla wideo bez dźwięku: gra tylko, gdy jest na ekranie; przy „ogranicz ruch” zostaje plakat.
export default function VideoLoop({ clip, className, label }: { clip: Clip; className?: string; label?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current!;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          if (v.preload !== "auto") v.preload = "auto";
          v.play().catch(() => {});
        } else v.pause();
      },
      { rootMargin: "200px" },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <video
      ref={ref}
      className={className}
      src={clip.src}
      poster={clip.poster}
      muted
      loop
      playsInline
      preload="none"
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
