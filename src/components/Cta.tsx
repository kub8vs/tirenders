import Link from "next/link";

// Przycisk akcji: etykieta przewija się na hover, okrągła ikona ze strzałką,
// tło zalewa się czerwienią jak światła startowe. Wersja "ghost" na drugorzędne akcje.
export default function Cta({ href, children, ghost, big, className = "", external }: { href: string; children: string; ghost?: boolean; big?: boolean; className?: string; external?: boolean }) {
  const cls = `cta ${ghost ? "cta-ghost" : ""} ${big ? "cta-big" : ""} magnetic ${className}`;
  const inner = (
    <>
      <span className="cta-label">
        <span>{children}</span>
        <span aria-hidden="true">{children}</span>
      </span>
      <span className="cta-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      </span>
    </>
  );
  return external ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
