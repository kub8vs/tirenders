"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ServiceRow } from "@/lib/sims";

const time = (iso: string) => new Intl.DateTimeFormat("pl-PL", { weekday: "short", day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));
const hour = (iso: string) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(new Date(iso));
const day = (d: Date | string) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Warsaw" }).format(new Date(d));
const untilLabel = (iso: string) => (day(iso) === day(new Date()) ? `Serwis do ${hour(iso)}` : `Serwis do ${time(iso)}`);
const OPTIONS: { label: string; until: number | "today" | null }[] = [
  { label: "1 godz.", until: 1 },
  { label: "2 godz.", until: 2 },
  { label: "Do końca dnia", until: "today" },
  { label: "Do odwołania", until: null },
];

/** Wyłączanie stanowiska na serwis. W tym czasie strona nie sprzedaje na nim jazd. */
export default function SimService({ rows }: { rows: ServiceRow[] }) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function send(id: string, on: boolean, until?: number | "today" | null) {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/admin/sims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, on, note, until }) });
    setBusy(false);
    if (!r.ok) return setErr("Nie udało się. Odśwież stronę i spróbuj jeszcze raz.");
    setOpen(null);
    setNote("");
    router.refresh();
  }

  return (
    <div className="sv">
      {rows.map((s) => (
        <div key={s.id} className={`sv-row glass${s.service ? " off" : ""}`}>
          <div className="sv-head">
            <b>{s.name}</b>
            <span className={`pill ${s.service ? "CANCELLED" : "PAID"}`}>
              {s.service ? (s.service.until ? untilLabel(s.service.until) : "Serwis do odwołania") : "Działa"}
            </span>
            {s.service ? (
              <button className="btn-white" disabled={busy} onClick={() => send(s.id, false)}>Włącz z powrotem</button>
            ) : (
              <button className="btn-ghost" onClick={() => { setOpen(open === s.id ? null : s.id); setErr(""); }}>{open === s.id ? "Anuluj" : "Wyłącz na serwis"}</button>
            )}
          </div>
          {s.service?.note && <p className="muted" style={{ fontSize: 13 }}>Powód: {s.service.note}</p>}
          {open === s.id && (
            <div className="sv-form">
              <input className="input" placeholder="Powód, np. nie działa kierownica" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} />
              <div className="row">
                {OPTIONS.map((o) => (
                  <button key={o.label} className="btn-ghost" disabled={busy} onClick={() => send(s.id, true, o.until)}>{o.label}</button>
                ))}
              </div>
              <p className="muted" style={{ fontSize: 12.5 }}>Od tej chwili strona nie sprzeda jazd na tym stanowisku. Klientów już zapisanych zobaczysz poniżej.</p>
            </div>
          )}
          {s.affected.length > 0 && (
            <div className="rc-state bad" style={{ fontSize: 14 }}>
              <b>{s.affected.length === 1 ? "1 klient jest" : `${s.affected.length} klientów jest`} zapisanych w czasie serwisu.</b> Przenieś ich w Kalendarzu na inne stanowisko albo zadzwoń.
              <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
                {s.affected.map((b) => (
                  <li key={b.id}>
                    {time(b.start)} · {b.durationMin} min · {b.name} · <a href={`tel:${b.phone.replace(/\s/g, "")}`}>{b.phone}</a> · <code>{b.code}</code>{b.status === "PENDING" ? " (czeka na płatność)" : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
      {err && <p className="rc-state bad">{err}</p>}
    </div>
  );
}
