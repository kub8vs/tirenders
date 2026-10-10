"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Bk = { id: string; code: string; simulatorId: string; start: string; end: string; name: string; phone: string; email: string; status: string; price: number; checkedIn: boolean; source: string; time: string; note: string };

const STATUS: Record<string, string> = { PAID: "Opłacona", COMPLETED: "Była", NO_SHOW: "Nie przyszedł", PENDING: "Płaci…", CANCELLED: "Odwołana", REFUNDED: "Zwrot" };
const PX_PER_MIN = 1.6;

export default function DayCalendar({ open, close, sims, bookings }: { open: string; close: string; sims: { id: string; name: string; active: boolean }[]; bookings: Bk[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<Bk | null>(null);
  const [refund, setRefund] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);
  const o = new Date(open).getTime();
  const c = new Date(close).getTime();
  const totalMin = (c - o) / 60000;
  const hours: number[] = [];
  for (let t = o; t <= c; t += 3600_000) hours.push(t);
  const now = Date.now();

  const act = async (body: object) => {
    const r = await fetch("/api/admin/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    setMsg(r.ok ? "Zapisano" : `Błąd: ${d.error}`);
    if (r.ok) {
      setSel(null);
      router.refresh();
    }
  };
  const checkin = async (code: string) => {
    const r = await fetch("/api/admin/checkin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
    const d = await r.json();
    setMsg(d.result === "ok" ? `Check-in: ${d.name}` : `Check-in: ${d.result}`);
    router.refresh();
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: sel ? "minmax(0,1fr) 320px" : "minmax(0,1fr)", gap: 16 }}>
      <div style={{ overflowX: "auto", border: "1px solid var(--line)", borderRadius: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: `60px repeat(${sims.length}, minmax(130px, 1fr))`, minWidth: 60 + sims.length * 130 }}>
          <div style={{ borderBottom: "1px solid var(--line)" }} />
          {sims.map((s) => (
            <div key={s.id} style={{ padding: "12px 10px", fontSize: 13, borderBottom: "1px solid var(--line)", borderLeft: "1px solid var(--line)", color: s.active ? "#fff" : "var(--dim)" }}>
              {s.name}
              {!s.active && <small style={{ display: "block" }}>nieaktywne</small>}
            </div>
          ))}
          <div style={{ position: "relative", height: totalMin * PX_PER_MIN }}>
            {hours.map((t) => (
              <span key={t} style={{ position: "absolute", top: ((t - o) / 60000) * PX_PER_MIN - 7, right: 8, fontSize: 11, color: "var(--muted)" }}>
                {new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" }).format(t)}
              </span>
            ))}
          </div>
          {sims.map((s) => (
            <div key={s.id} style={{ position: "relative", height: totalMin * PX_PER_MIN, borderLeft: "1px solid var(--line)", background: s.active ? "transparent" : "repeating-linear-gradient(45deg, #080808 0 8px, #0d0d0d 8px 16px)" }}>
              {hours.map((t) => (
                <div key={t} style={{ position: "absolute", left: 0, right: 0, top: ((t - o) / 60000) * PX_PER_MIN, borderTop: "1px solid rgba(255,255,255,.04)" }} />
              ))}
              {now > o && now < c && <div style={{ position: "absolute", left: 0, right: 0, top: ((now - o) / 60000) * PX_PER_MIN, borderTop: "1px solid var(--red)", zIndex: 2 }} />}
              {bookings
                .filter((b) => b.simulatorId === s.id)
                .map((b) => {
                  const top = ((new Date(b.start).getTime() - o) / 60000) * PX_PER_MIN;
                  const h = ((new Date(b.end).getTime() - new Date(b.start).getTime()) / 60000) * PX_PER_MIN;
                  const dead = ["CANCELLED", "REFUNDED"].includes(b.status);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSel(b)}
                      style={{
                        position: "absolute", left: 4, right: 4, top, height: Math.max(h - 2, 22), borderRadius: 8, padding: "5px 8px", textAlign: "left", cursor: "pointer", overflow: "hidden",
                        border: `1px solid ${b.checkedIn ? "rgba(61,220,132,.6)" : dead ? "rgba(255,42,42,.3)" : "rgba(255,255,255,.25)"}`,
                        background: dead ? "rgba(255,42,42,.06)" : b.status === "PENDING" ? "rgba(255,200,0,.08)" : b.checkedIn ? "rgba(61,220,132,.14)" : "rgba(255,255,255,.1)",
                        opacity: dead ? 0.5 : 1, fontSize: 12, lineHeight: 1.25, color: "#fff",
                      }}
                    >
                      <b style={{ fontWeight: 500 }}>{b.time}</b> {b.name}
                      <small style={{ display: "block", color: "#aaa" }}>{STATUS[b.status] ?? b.status}{b.source === "ADMIN" ? " · tel." : ""}</small>
                    </button>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
      {sel && (
        <div className="glass" style={{ padding: 20, display: "grid", gap: 12, alignContent: "start", position: "sticky", top: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <b style={{ letterSpacing: ".16em" }}>{sel.code}</b>
            <button type="button" onClick={() => setSel(null)} style={{ background: "none", border: 0, cursor: "pointer", color: "#aaa" }} aria-label="Zamknij">✕</button>
          </div>
          <span className={`pill ${sel.status}`} style={{ justifySelf: "start" }}>{STATUS[sel.status] ?? sel.status}</span>
          <div style={{ fontSize: 14, display: "grid", gap: 4 }}>
            <span>{sel.name}</span>
            <span style={{ color: "#aaa" }}>{sel.phone}</span>
            <span style={{ color: "#aaa", wordBreak: "break-all" }}>{sel.email}</span>
            <span>{(sel.price / 100).toFixed(2)} zł</span>
            {sel.note && <span style={{ color: "#aaa" }}>Notatka: {sel.note}</span>}
          </div>
          {sel.status === "PAID" && !sel.checkedIn && (
            <button className="btn-white" type="button" onClick={() => checkin(sel.code)}>Check-in</button>
          )}
          {sel.status === "PAID" && (
            <div style={{ display: "grid", gap: 8, borderTop: "1px solid var(--line)", paddingTop: 12 }}>
              <label style={{ fontSize: 13, color: "var(--muted)" }} htmlFor="refund">Zwrot (zł), puste = cała kwota</label>
              <input id="refund" className="input" inputMode="decimal" value={refund} onChange={(e) => setRefund(e.target.value)} style={{ height: 44 }} />
              <button className="btn-ghost" type="button" onClick={() => act({ action: "cancel", id: sel.id, refund: refund ? Math.round(parseFloat(refund.replace(",", ".")) * 100) : undefined })}>
                Odwołaj i zwróć
              </button>
            </div>
          )}
          {msg && <p className="ok">{msg}</p>}
        </div>
      )}
    </div>
  );
}
