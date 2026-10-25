"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import type { Dict, Lang } from "@/content/dict";

export default function Header({ t, lang }: { t: Dict; lang: Lang }) {
  const path = usePathname();
  const router = useRouter();
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  // Na stronie głównej logo w nagłówku pojawia się dopiero po zjechaniu poniżej intro (żeby nie było dwóch logo naraz)
  useEffect(() => {
    const html = document.documentElement;
    const home = path === "/";
    html.dataset.home = home ? "1" : "0";
    if (!home) {
      html.dataset.scrolled = "1";
      return;
    }
    const on = () => {
      html.dataset.scrolled = window.scrollY > window.innerHeight * 0.55 ? "1" : "0";
      if (window.scrollY > 80 && html.dataset.intro === "on") html.dataset.intro = "off";
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [path]);

  const links: [string, string][] = [
    ["/oferta", t.nav.offer],
    ["/cennik", t.nav.pricing],
    ["/rezerwacja", t.nav.booking],
    ["/sklep", t.nav.shop],
    ["/o-nas", t.nav.about],
    ["/faq", t.nav.faq],
  ];
  const cur = (href: string) => (path === href || path.startsWith(href + "/") ? "page" : undefined);
  const switchLang = () => {
    document.cookie = `lang=${lang === "pl" ? "en" : "pl"}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  if (path.startsWith("/panel")) return null;

  return (
    <>
      <header className="site-header" data-header>
        <Link href="/" className="logo" aria-label="Tirenders, strona główna">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/img/2real-logo-sm.webp" alt="2Real Simracing by Tirenders" width={520} height={180} />
        </Link>
        <nav className="nav-pill" aria-label="Główna nawigacja">
          {links.map(([href, label]) => (
            <Link key={href} href={href} aria-current={cur(href)}>
              {label}
            </Link>
          ))}
        </nav>
        <div className="head-right">
          <button className="lang" type="button" onClick={switchLang} aria-label={lang === "pl" ? "Switch to English" : "Przełącz na polski"}>
            {lang === "pl" ? "EN" : "PL"}
          </button>
          <span className="status-pill">
            <span className="dot" aria-hidden="true" />
            <span>
              {t.pill.status}
              <small>{t.pill.city}</small>
            </span>
          </span>
          <Link href={data?.user ? "/konto" : "/konto/logowanie"} className="btn-white acct-pill">
            {data?.user ? t.account.account : t.account.signIn}
          </Link>
          <button className="burger" type="button" aria-expanded={open} aria-controls="mnav" aria-label="Menu" onClick={() => setOpen(!open)}>
            <i />
            <i />
          </button>
        </div>
      </header>
      <nav id="mnav" className={`mobile-nav ${open ? "open" : ""}`} aria-hidden={!open}>
        {links.map(([href, label]) => (
          <Link key={href} href={href} aria-current={cur(href)} tabIndex={open ? 0 : -1}>
            {label}
          </Link>
        ))}
        <Link href={data?.user ? "/konto" : "/konto/logowanie"} tabIndex={open ? 0 : -1}>
          {data?.user ? t.account.account : t.account.signIn}
        </Link>
      </nav>
    </>
  );
}
