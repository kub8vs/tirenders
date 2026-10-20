"use client";

import { useEffect, useState } from "react";

type Day = { date: string; label: string; open: number; close: number };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

// Rezerwacja telefoniczna (też cały salon). Płatność tylko przez stronę: klient dostaje link SMS-em i mailem.
export default function PhoneBooking({ days, step, durations, sims }: { days: Day[]; step: number; durations: number[]; sims: { id: string; name: string }[] }) {
  const [f, setF] = useState({ date: days[0]?.date ?? "", time: "", duration: 60, name: "", phone: "", email: "", sims: [] as string[] });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Godziny startu, przy których cała jazda mieści się w godzinach otwarcia (zapis 24 h).
  const times = (date: string, duration: number) => {
    const d = days.find((x) => x.date === date);
    if (!d) return [];
    const out: string[] = [];
    for (let m = d.open; m + duration <= d.close; m += step) out.push(hhmm(m));
    return out;
  };
  const list = times(f.date, f.duration);
  const time = list.includes(f.time) ? f.time : "";
  const toggle = (id: string) => setF({ ...f, sims: f.sims.includes(id) ? f.sims.filter((x) => x !== id) : [...f.sims, id] });
  const all = f.sims.length === sims.length;

  // Cena z rabatem grupowym (3+ stanowiska −10%, 5+ −15%, cały salon −25%), liczona przez serwer.
  const [q, setQ] = useState<{ list: number; discount: number; total: number; groupPercent: number } | null>(null);
  useEffect(() => {
    if (!f.sims.length) return setQ(null);
    const c = new AbortController();
    fetch(`/api/quote?sims=${f.sims.join(",")}&duration=${f.duration}`, { signal: c.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then(setQ)
      .catch(() => {});
    return () => c.abort();
  }, [f.sims, f.duration]);
  const zl = (g: number) => `${(g / 100).toLocaleString("pl-PL", { maximumFractionDigits: 2 })} zł`;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", simulatorIds: f.sims, date: f.date, time, durationMin: f.duration, name: f.name, email: f.email, phone: f.phone }),
    });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) {
      const until = new Date(d.holdExpiresAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
      setMsg({ ok: true, text: `Zablokowano (${d.codes.join(", ")}). Klient dostał SMS i mail z linkiem do zapłaty, ważnym do ${until}. Link: ${d.payUrl}` });
      setF({ ...f, name: "", phone: "", email: "", sims: [] });
    } else
      setMsg({
        ok: false,
        text:
          d.error === "slot_taken" ? "Któreś z wybranych stanowisk jest wtedy zajęte. Wybierz inną godzinę albo inne stanowiska. Nic nie zostało zapisane."
          : d.error === "too_soon" ? "Za mało czasu na zapłatę: termin musi być co najmniej 30 min od teraz."
          : d.error === "closed" ? "Ta godzina wychodzi poza godziny otwarcia."
          : "Sprawdź dane: imię i nazwisko, telefon (9 cyfr) i e-mail.",
      });
  };

  return (
    <form onSubmit={submit} className="glass pb" style={{ padding: 22, display: "grid", gap: 18, maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
      <style>{`.pb .field { justify-items: center; } .pb .field .input { width: 100%; text-align: center; text-align-last: center; } .pb .chips-row { justify-content: center; }`}</style>
      <div className="field">
        <label>Stanowiska</label>
        <div className="chips-row" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {sims.map((s) => (
            <button type="button" key={s.id} className="chip" onClick={() => toggle(s.id)} style={f.sims.includes(s.id) ? { background: "#fff", color: "#000" } : undefined} aria-pressed={f.sims.includes(s.id)}>
              {s.name}
            </button>
          ))}
          <button type="button" className="chip" onClick={() => setF({ ...f, sims: all ? [] : sims.map((s) => s.id) })} style={all ? { background: "#fff", color: "#000" } : undefined} aria-pressed={all}>
            Cały salon
          </button>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="pb-day">Dzień</label>
          <select id="pb-day" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })}>
            {days.map((d) => <option key={d.date} value={d.date}>{d.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pb-time">Godzina</label>
          <select id="pb-time" className="input" value={time} onChange={(e) => setF({ ...f, time: e.target.value })}>
            <option value="" disabled>Wybierz</option>
            {list.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pb-dur">Czas jazdy</label>
          <select id="pb-dur" className="input" value={f.duration} onChange={(e) => setF({ ...f, duration: Number(e.target.value) })}>
            {durations.map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="pb-name">Imię i nazwisko</label><input id="pb-name" className="input" autoComplete="off" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="pb-phone">Telefon</label><input id="pb-phone" className="input" type="tel" inputMode="tel" autoComplete="off" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="np. 600 100 200" /></div>
        <div className="field"><label htmlFor="pb-email">E-mail</label><input id="pb-email" className="input" type="email" autoComplete="off" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
      </div>
      <div className="field">
        <label>Płatność</label>
        <p style={{ margin: 0 }}>Przez stronę: link do zapłaty SMS-em i mailem (BLIK, karta, Apple Pay, Google Pay).</p>
      </div>
      {q && (
        <div className="field" role="status">
          <label>Do zapłaty</label>
          <p style={{ margin: 0, fontSize: 26, color: "#fff" }}>
            {q.discount > 0 && <s style={{ color: "var(--muted)", fontSize: 18, marginRight: 10 }}>{zl(q.list)}</s>}
            {zl(q.total)}
          </p>
          {q.discount > 0 && <small style={{ color: "#9ff0c0" }}>{all ? "Cały salon" : "Rabat grupowy"} −{q.groupPercent}% (−{zl(q.discount)})</small>}
        </div>
      )}
      <div>
        <button className="btn-white" type="submit" disabled={busy || !f.sims.length || !time || f.name.trim().length < 2 || !f.phone || !f.email}>
          {busy ? "Zapisuję…" : "Zablokuj termin i wyślij link do zapłaty"}
        </button>
      </div>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status" style={{ wordBreak: "break-word" }}>{msg.text}</p>}
    </form>
  );
}
