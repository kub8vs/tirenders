"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AutoRefresh({ ms }: { ms: number }) {
  const r = useRouter();
  useEffect(() => {
    const id = setInterval(() => r.refresh(), ms);
    return () => clearInterval(id);
  }, [r, ms]);
  return null;
}
