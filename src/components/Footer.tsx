"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "@/config/site";
import type { Dict } from "@/content/dict";

export default function Footer({ t }: { t: Dict }) {
  const path = usePathname();
  if (path.startsWith("/admin")) return null;
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <h4>{SITE.salon}</h4>
            <p style={{ maxWidth: "36ch" }}>{t.meta.description}</p>
          </div>
          <div>
            <h4>{t.footer.contact}</h4>
            <ul>
              <li>{SITE.address ?? t.footer.addressSoon}</li>
              <li>{SITE.phone ?? t.footer.phoneSoon}</li>
              <li>
                <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
              </li>
              <li style={{ color: "var(--dim)", fontSize: 13 }}>{t.footer.longer}</li>
            </ul>
          </div>
          <div>
            <h4>Menu</h4>
            <ul>
              <li><Link href="/oferta">{t.nav.offer}</Link></li>
              <li><Link href="/cennik">{t.nav.pricing}</Link></li>
              <li><Link href="/rezerwacja">{t.nav.booking}</Link></li>
              <li><Link href="/sklep">{t.nav.shop}</Link></li>
              <li><Link href="/o-nas">{t.nav.about}</Link></li>
              <li><Link href="/faq">{t.nav.faq}</Link></li>
            </ul>
          </div>
          <div>
            <h4>Social</h4>
            <ul>
              <li><a href={SITE.instagram.tirenders} target="_blank" rel="noreferrer">Instagram · Tirenders</a></li>
              <li><a href={SITE.instagram.salon} target="_blank" rel="noreferrer">Instagram · 2Real Simracing</a></li>
              <li><a href={SITE.instagram.himera} target="_blank" rel="noreferrer">Instagram · Himera</a></li>
            </ul>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© {new Date().getFullYear()} {t.footer.madeFor}. {t.footer.rights}</span>
          <span style={{ display: "flex", gap: 18 }}>
            <Link href="/regulamin">{t.footer.legal.terms}</Link>
            <Link href="/polityka-prywatnosci">{t.footer.legal.privacy}</Link>
            <Link href="/cookies">{t.footer.legal.cookies}</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
