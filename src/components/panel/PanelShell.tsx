"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export type NavGroup = { title: string; items: [href: string, label: string][] };

export default function PanelShell({ groups, email, role, children }: { groups: NavGroup[]; email: string; role: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  // Najdłuższy pasujący adres jest aktywny (żeby /panel nie świecił się na każdej podstronie).
  const all = groups.flatMap((g) => g.items.map(([h]) => h));
  const active = all.filter((h) => path === h || path.startsWith(h + "/")).sort((a, b) => b.length - a.length)[0];
  return (
    <div className="adm">
      <div className="adm-top">
        <Link href="/panel"><img src="/img/2real-logo-sm.webp" alt="2Real Simracing" width={520} height={180} /></Link>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="adm-side">{open ? "Zamknij" : "Menu"}</button>
      </div>
      <aside id="adm-side" className={`adm-side${open ? " open" : ""}`}>
        <Link href="/panel" className="adm-brand">
          <img src="/img/2real-logo-sm.webp" alt="2Real Simracing by Tirenders" width={520} height={180} />
          <small>panel</small>
        </Link>
        <nav className="adm-nav">
          {groups.map((g) => (
            <div key={g.title}>
              <h4>{g.title}</h4>
              {g.items.map(([href, label]) => (
                <Link key={href} href={href} aria-current={href === active ? "page" : undefined}>{label}</Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="adm-me">
          {email}
          <small>{role}</small>
          <button type="button" onClick={() => signOut({ callbackUrl: "/panel/logowanie" })}>Wyloguj</button>
        </div>
      </aside>
      <div className="adm-main">{children}</div>
    </div>
  );
}
