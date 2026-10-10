"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav({ items }: { items: string[][] }) {
  const p = usePathname();
  return (
    <nav style={{ display: "grid", gap: 2 }}>
      {items.map(([href, label]) => (
        <Link key={href} href={href} aria-current={p === href ? "page" : undefined} style={{ padding: "10px 10px", borderRadius: 10, fontSize: 14, color: p === href ? "#fff" : "#9a9a9a", background: p === href ? "rgba(255,255,255,.07)" : "transparent" }}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
