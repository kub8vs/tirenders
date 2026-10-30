"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { DeskRow } from "@/lib/reception";

const LABEL: Record<string, string> = { PAID: "Opłacone, czeka", COMPLETED: "Był", NO_SHOW: "Nie przyszedł", PENDING: "Czeka na płatność", CANCELLED: "Odwołana", REFUNDED: "Zwrot", EXPIRED: "Wygasła" };

function state(b: DeskRow, now: number) {
  if (b.checkedInAt) return new Date(b.end).getTime() > now && new Date(b.start).getTime() <= now ? { cls: "now", label: "Jedzie teraz" } : { cls: "in", label: "Przyszedł" };
  if (b.status === "NO_SHOW") return { cls: "no", label: "Nie przyszedł" };
  if (b.status === "PENDING") return { cls: "wait", label: "Czeka na płatność" };
  return { cls: "", label: LABEL[b.status] ?? b.status };
}

export default function ReceptionBoard({ rows, sims, today, date }: { rows: DeskRow[]; sims: { id: string; name: string }[]; today: boolean; date: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [found, setFound] = useState<DeskRow[] | null>(null);
  const [open, setOpen] = useState<DeskRow[] | null>(null);
  const [msg, setMsg] = useState<{ cls: string; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Tablica odświeża się sama co 30 s (nowe rezerwacje, zmiany statusów).
  useEffect(() => {
    const t = setInterval(() => { setNow(Date.now()); router.refresh(); }, 30_000);
    return () => clearInterval(t);
  }, [router]);

  const soon = useMemo(() => rows.filter((b) => !b.checkedInAt && b.status === "PAID" && new Date(b.start).getTime() - now < 30 * 60_000 && new Date(b.end).getTime() > now), [rows, now]);

  const groupOf = (b: DeskRow) => (b.groupId ? rows.filter((x) => x.groupId === b.groupId) : [b]);

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const term = q.trim();
    if (term.length < 2) return;
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "find", q: term }) });
    const d = await r.json().catch(() => ({ results: [] }));
    setBusy(false);
    const res: DeskRow[] = d.results ?? [];
    setFound(res);
    // Jedna rezerwacja (albo jedna grupa) = od razu karta do potwierdzenia.
    const keys = new Set(res.map((b) => b.groupId ?? b.id));
    if (keys.size === 1) setOpen(res);
  };

  const act = async (action: "confirm" | "noshow" | "undo", list: DeskRow[]) => {
    setBusy(true);
    const r = await fetch("/api/admin/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids: list.map((b) => b.id) }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (d.refused?.length) setMsg({ cls: "bad", text: `Nie można: ${d.refused.map((x: { code: string; reason: string }) => `${x.code} (${x.reason})`).join(", ")}` });
    else {
      const who = list[0]?.name ?? "";
      setMsg({ cls: "ok", text: action === "confirm" ? `Przyjęty: ${who}` : action === "noshow" ? `Oznaczono: nie przyszedł (${who})` : "Cofnięto" });
      setOpen(null);
      setFound(null);
      setQ("");
    }
    router.refresh();
  };

  const verdict = (list: DeskRow[]) => {
    const b = list[0];
    const start = new Date(b.start).getTime();
    if (list.every((x) => x.checkedInAt)) return { cls: "ok", text: "Już potwierdzone przyjście." };
    if (["CANCELLED", "REFUNDED", "EXPIRED"].includes(b.status)) return { cls: "bad", text: "Rezerwacja odwołana albo wygasła. Nie wpuszczaj na ten kod." };
    if (b.status === "PENDING") return { cls: "bad", text: "Rezerwacja nieopłacona." };
    if (start - now > 3 * 3600_000) return { cls: "info", text: `To rezerwacja na inny termin: ${b.date}, ${b.from}.` };
    if (new Date(b.end).getTime() < now) return { cls: "info", text: "Czas tej jazdy już minął." };
    return { cls: "ok", text: "Opłacone. Sprawdź imię i nazwisko i potwierdź." };
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 22 }}>
      <form className="rc-search" onSubmit={search}>
        <input className="input" placeholder="Kod albo nazwisko gościa" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" autoCapitalize="characters" aria-label="Kod albo nazwisko gościa" />
        <button className="btn-white" type="submit" disabled={busy || q.trim().length < 2} style={{ height: 60 }}>Szukaj</button>
      </form>
      {msg && !open && <div className={`rc-state ${msg.cls}`} role="status">{msg.text}</div>}

      {found && !open && (
        <div className="glass" style={{ padding: 14, display: "grid", gap: 8 }}>
          {found.length === 0 && <p className="muted">Nic nie znaleziono. Sprawdź kod (6 znaków) albo wpisz samo nazwisko.</p>}
          {found.map((b) => (
            <button key={b.id} type="button" className="rc-card" onClick={() => setOpen(groupOf(b).length > 1 ? groupOf(b) : found.filter((x) => (b.groupId ? x.groupId === b.groupId : x.id === b.id)))}>
              <b>{b.name}</b>
              <span className="t">{b.date} · {b.from}–{b.to} · {b.sim}</span>
              <code>{b.code}</code>
            </button>
          ))}
        </div>
      )}

      {today && soon.length > 0 && (
        <section>
          <h2 style={{ margin: "0 0 10px" }}>Za chwilę</h2>
          <div className="rc-soon">
            {soon.map((b) => (
              <button key={b.id} type="button" className="glass" onClick={() => setOpen(groupOf(b))}>
                <b style={{ fontWeight: 500 }}>{b.from} · {b.sim}</b>
                <span>{b.name}</span>
                <code style={{ letterSpacing: ".14em", color: "#aaa" }}>{b.code}</code>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>{today ? "Dzisiaj" : date}</h2>
          <span className="muted" style={{ fontSize: 13 }}>
            {rows.filter((b) => b.checkedInAt).length} przyjętych · {rows.filter((b) => b.status === "PAID" && !b.checkedInAt).length} czeka · {rows.filter((b) => b.status === "NO_SHOW").length} nie przyszło
          </span>
        </div>
        <div className="rc-board" style={{ ["--cols" as string]: sims.length }}>
          {sims.map((s) => {
            const list = rows.filter((b) => b.simulatorId === s.id);
            return (
              <div key={s.id} className="rc-col">
                <h3>{s.name}<small>{list.length}</small></h3>
                {list.length === 0 && <p className="rc-empty">Brak rezerwacji</p>}
                {list.map((b) => {
                  const st = state(b, now);
                  return (
                    <button key={b.id} type="button" className={`rc-card ${st.cls}`} onClick={() => setOpen(groupOf(b))}>
                      <span className="t">{b.from}–{b.to} · {b.durationMin} min</span>
                      <b>{b.name}</b>
                      <code>{b.code}</code>
                      <span className="muted" style={{ fontSize: 12.5 }}>{st.label}{b.source === "ADMIN" ? " · telefon" : ""}{b.groupId ? " · grupa" : ""}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      {open && open.length > 0 && (() => {
        const v = verdict(open);
        const b = open[0];
        const canConfirm = v.cls === "ok" && open.some((x) => !x.checkedInAt);
        return (
          <div className="rc-modal" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Potwierdzenie gościa">
            <div className="rc-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <b style={{ fontSize: 22, fontWeight: 500 }}>{b.name}</b>
                <button type="button" onClick={() => setOpen(null)} style={{ background: "none", border: 0, color: "#aaa", fontSize: 20, cursor: "pointer" }} aria-label="Zamknij">✕</button>
              </div>
              <div className={`rc-state ${v.cls === "ok" && !canConfirm ? "ok" : v.cls}`}>{v.text}</div>
              <dl>
                <dt>Dzień</dt><dd>{b.date}</dd>
                <dt>Godzina</dt><dd>{b.from}–{b.to} ({b.durationMin} min)</dd>
                <dt>{open.length > 1 ? "Stanowiska" : "Stanowisko"}</dt>
                <dd>{open.map((x) => <div key={x.id}>{x.sim} · <code style={{ letterSpacing: ".12em" }}>{x.code}</code>{x.checkedInAt ? " ✓" : ""}</div>)}</dd>
                <dt>Telefon</dt><dd><a href={`tel:${b.phone.replace(/\s/g, "")}`} style={{ textDecoration: "underline" }}>{b.phone}</a></dd>
                {b.note && (<><dt>Notatka</dt><dd>{b.note}</dd></>)}
                {b.checkedInAt && (<><dt>Przyjął</dt><dd>{b.checkedInBy ?? "—"} · {new Date(b.checkedInAt).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" })}</dd></>)}
              </dl>
              {canConfirm && (
                <button className="btn-white big" type="button" disabled={busy} onClick={() => act("confirm", open.filter((x) => !x.checkedInAt))}>
                  {open.length > 1 ? `Potwierdź przyjście (${open.filter((x) => !x.checkedInAt).length} stanowisk)` : "Potwierdź przyjście"}
                </button>
              )}
              <div className="row">
                {open.some((x) => x.status === "PAID" && !x.checkedInAt) && new Date(b.start).getTime() < now && (
                  <button className="btn-ghost" type="button" disabled={busy} onClick={() => act("noshow", open.filter((x) => x.status === "PAID" && !x.checkedInAt))}>Nie przyszedł</button>
                )}
                {open.some((x) => x.checkedInAt || x.status === "NO_SHOW") && (
                  <button className="btn-ghost" type="button" disabled={busy} onClick={() => act("undo", open.filter((x) => x.checkedInAt || x.status === "NO_SHOW"))}>Cofnij</button>
                )}
              </div>
              {msg && <div className={`rc-state ${msg.cls}`} role="status">{msg.text}</div>}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
