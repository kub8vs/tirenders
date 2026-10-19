"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BOOKING, HOURS } from "@/config/site";

/** Godziny startu co 15 min, przy których cała jazda mieści się w godzinach otwarcia danego dnia, w zapisie 24-godzinnym (17:00, 17:15…). */
function startTimes(date: string, duration: number) {
  const h = HOURS[new Date(`${date}T12:00:00Z`).getUTCDay()] ?? { open: "10:00", close: "24:00" };
  const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
  const out: string[] = [];
  for (let m = toMin(h.open); m + duration <= toMin(h.close); m += BOOKING.slotStepMin) out.push(`${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`);
  return out;
}

// Rezerwacje telefoniczne (powyżej 90 min = kilka bloków, wyłączność = wszystkie stanowiska).
// Domyślnie klient dostaje SMS i mail z linkiem do zapłaty na stronie; termin jest zablokowany od razu.
export default function PhoneBooking({ date, sims }: { date: string; sims: { id: string; name: string }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ time: "18:00", duration: 60, name: "", email: "", phone: "", note: "", sims: [] as string[], payment: "link" as "link" | "onsite" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const toggle = (id: string) => setF({ ...f, sims: f.sims.includes(id) ? f.sims.filter((x) => x !== id) : [...f.sims, id] });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const [hh, mm] = f.time.split(":").map(Number);
    // czas warszawski → ISO (serwer sprawdzi godziny otwarcia i kolizje)
    const local = new Date(`${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
    const tzName = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Warsaw", timeZoneName: "shortOffset" }).formatToParts(local).find((p) => p.type === "timeZoneName")?.value ?? "GMT+1";
    const off = tzName.replace("GMT", "") || "+0";
    const [oh, om = "0"] = off.split(":");
    const sign = oh.startsWith("-") ? "-" : "+";
    const iso = `${date}T${f.time}:00${sign}${String(Math.abs(parseInt(oh))).padStart(2, "0")}:${om.padStart(2, "0")}`;
    const r = await fetch("/api/admin/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", simulatorIds: f.sims, start: new Date(iso).toISOString(), durationMin: f.duration, name: f.name, email: f.email, phone: f.phone, note: f.note, payment: f.payment }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setMsg({
        ok: true,
        text: d.payUrl
          ? `Zablokowano: ${d.codes.join(", ")}. Klient dostał SMS i mail z linkiem do zapłaty (ważny do ${new Date(d.holdExpiresAt).toLocaleString("pl-PL", { timeZone: "Europe/Warsaw", dateStyle: "short", timeStyle: "short" })}): ${d.payUrl}`
          : `Dodano: ${d.codes.join(", ")}`,
      });
      router.refresh();
    } else setMsg({ ok: false, text: d.error === "slot_taken" ? "Któreś stanowisko jest wtedy zajęte (część mogła się zapisać – sprawdź kalendarz)." : d.error === "closed" ? "Ta godzina wychodzi poza godziny otwarcia (sprawdź też długość jazdy)." : d.error === "too_soon" ? "Za mało czasu na zapłatę linkiem: termin musi być co najmniej 30 min od teraz. Wybierz późniejszą godzinę albo płatność na miejscu." : "Sprawdź dane." });
  };
  return (
    <form onSubmit={submit} className="glass" style={{ padding: 22, display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {sims.map((s) => (
          <button type="button" key={s.id} className="chip" onClick={() => toggle(s.id)} style={f.sims.includes(s.id) ? { background: "#fff", color: "#000" } : undefined} aria-pressed={f.sims.includes(s.id)}>
            {s.name}
          </button>
        ))}
        <button type="button" className="chip" onClick={() => setF({ ...f, sims: sims.map((s) => s.id) })}>Cały salon</button>
      </div>
      <div className="form-grid">
        <div className="field"><label htmlFor="pb-time">Godzina ({date})</label><select id="pb-time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })}>
            {startTimes(date, f.duration).map((t) => <option key={t} value={t}>{t}</option>)}
          </select></div>
        <div className="field">
          <label htmlFor="pb-dur">Czas</label>
          <select id="pb-dur" className="input" value={f.duration} onChange={(e) => {
            const duration = Number(e.target.value);
            const times = startTimes(date, duration);
            setF({ ...f, duration, time: times.includes(f.time) ? f.time : (times[times.length - 1] ?? f.time) });
          }}>
            {[15, 30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} min</option>)}
          </select>
        </div>
        <div className="field"><label htmlFor="pb-name">Klient</label><input id="pb-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field"><label htmlFor="pb-phone">Telefon</label><input id="pb-phone" className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="field"><label htmlFor="pb-email">E-mail</label><input id="pb-email" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div className="field">
          <label htmlFor="pb-pay">Płatność</label>
          <select id="pb-pay" className="input" value={f.payment} onChange={(e) => setF({ ...f, payment: e.target.value as "link" | "onsite" })}>
            <option value="link">Link do zapłaty SMS-em</option>
            <option value="onsite">Na miejscu</option>
          </select>
        </div>
        <div className="field"><label htmlFor="pb-note">Notatka</label><input id="pb-note" className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="np. urodziny, 2 h – drugi blok dodaj osobno" /></div>
      </div>
      <div><button className="btn-white" type="submit" disabled={!f.sims.length || !f.name || !f.phone || !f.email}>{f.payment === "link" ? "Zablokuj termin i wyślij link do zapłaty" : "Dodaj rezerwację (płatność na miejscu)"}</button></div>
      {msg && <p className={msg.ok ? "ok" : "err"}>{msg.text}</p>}
    </form>
  );
}
