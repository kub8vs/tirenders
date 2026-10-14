import Link from "next/link";
import { simById } from "@/config/site";
import { prisma } from "@/lib/db";
import { getLang, tr } from "@/lib/i18n";
import { pln } from "@/lib/pricing";
import { fmtLong } from "@/lib/time";
import { manageUrl } from "@/lib/tokens";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "Rezerwacja potwierdzona" };

export default async function Page({ searchParams }: { searchParams: { b?: string } }) {
  const l = getLang();
  const b = searchParams.b ? await prisma.booking.findUnique({ where: { id: searchParams.b } }) : null;
  const paid = b && ["PAID", "COMPLETED"].includes(b.status);
  const group = b?.groupId ? await prisma.booking.findMany({ where: { groupId: b.groupId, id: { not: b.id } }, orderBy: { createdAt: "asc" } }) : [];
  return (
    <div className="wrap page-hero" style={{ minHeight: "80vh" }}>
      {!b ? (
        <h1>{tr(l, { pl: "Nie znaleźliśmy rezerwacji.", en: "Booking not found." })}</h1>
      ) : paid ? (
        <>
          <p className="eyebrow">{tr(l, { pl: "Opłacone", en: "Paid" })}</p>
          <h1>{tr(l, { pl: "Pole position zajęte.", en: "Pole position secured." })}</h1>
          <p>
            {fmtLong(b.start, l)} · {simById(b.simulatorId)?.name} · {b.durationMin} min · {pln(b.priceGross, l)}
          </p>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap", marginTop: 40 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/qr/${b.code}`} alt={`QR ${b.code}`} width={170} height={170} style={{ background: "#fff", padding: 10, borderRadius: 14 }} />
            <div style={{ display: "grid", gap: 10 }}>
              <span className="eyebrow">{tr(l, { pl: "Kod rezerwacji", en: "Booking code" })}</span>
              <b style={{ fontSize: 40, fontWeight: 500, letterSpacing: ".18em" }}>{b.code}</b>
              <span style={{ color: "var(--muted)", maxWidth: "44ch" }}>
                {tr(l, { pl: "Wysłaliśmy go też mailem i SMS-em. Pokaż QR przy wejściu.", en: "We've also sent it by email and SMS. Show the QR at the door." })}
              </span>
            </div>
          </div>
          {group.length > 0 && (
            <div style={{ marginTop: 34, display: "grid", gap: 8 }}>
              <span className="eyebrow">{tr(l, { pl: "Pozostałe stanowiska w Twojej rezerwacji", en: "Other rigs in your booking" })}</span>
              {group.map((g) => (
                <a key={g.id} href={manageUrl(g.code)} style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <b style={{ letterSpacing: ".14em", fontWeight: 500 }}>{g.code}</b>
                  <span style={{ color: "var(--muted)" }}>{simById(g.simulatorId)?.name} · {pln(g.priceGross, l)}</span>
                </a>
              ))}
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{tr(l, { pl: "Każde stanowisko ma własny kod i QR w mailu.", en: "Each rig has its own code and QR in the email." })}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 40, flexWrap: "wrap" }}>
            <a className="btn-white" href={manageUrl(b.code)}>{tr(l, { pl: "Zarządzaj rezerwacją", en: "Manage booking" })}</a>
            <Link className="btn-ghost" href="/rezerwacja" style={{ height: 54 }}>{tr(l, { pl: "Zarezerwuj kolejne stanowisko", en: "Book another rig" })}</Link>
          </div>
        </>
      ) : b.status === "PENDING" ? (
        <>
          <AutoRefresh ms={2500} />
          <h1>{tr(l, { pl: "Czekamy na potwierdzenie płatności…", en: "Waiting for payment confirmation…" })}</h1>
          <p>{tr(l, { pl: "To zwykle trwa kilka sekund. Strona odświeży się sama.", en: "This usually takes a few seconds. The page refreshes on its own." })}</p>
        </>
      ) : (
        <>
          <h1>{tr(l, { pl: "Ta rezerwacja nie jest aktywna.", en: "This booking isn't active." })}</h1>
          <p>
            {b.status === "REFUNDED"
              ? tr(l, { pl: "Płatność dotarła po czasie, a termin zdążył zająć ktoś inny. Zwróciliśmy całą kwotę.", en: "Your payment arrived late and someone took the slot. We've refunded the full amount." })
              : tr(l, { pl: "Czas na płatność minął. Wybierz termin jeszcze raz.", en: "The payment window has passed. Pick your slot again." })}
          </p>
          <div style={{ marginTop: 30 }}>
            <Link className="btn-white" href="/rezerwacja">{tr(l, { pl: "Wybierz termin", en: "Pick a slot" })}</Link>
          </div>
        </>
      )}
    </div>
  );
}
