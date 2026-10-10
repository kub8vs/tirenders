"use client";

import { useEffect, useState } from "react";
import { SITE, simById } from "@/config/site";

type B = { id: string; code: string; simulatorId: string; start: string; durationMin: number; priceGross: number; status: string };

const T = {
  pl: {
    cancel: "Odwołaj rezerwację",
    confirmCancel: "Na pewno odwołać? Zwrócimy",
    yes: "Tak, odwołaj",
    no: "Zostaw",
    noCancel: "Do startu zostało mniej niż 24 h, więc odwołanie bez kosztów nie jest już możliwe. Możesz zmienić termin.",
    noChange: "Do startu zostało mniej niż 3 h. Zmiany już nie są możliwe.",
    reschedule: "Zmień termin",
    pickDay: "Nowy dzień",
    pickTime: "Nowa godzina",
    none: "Brak wolnych terminów tego dnia dla tego typu stanowiska.",
    save: "Zapisz nowy termin",
    saved: "Zapisane. Wysłaliśmy potwierdzenie na e-mail.",
    cancelled: "Rezerwacja odwołana.",
    error: "Nie udało się. Termin mógł zostać zajęty – wybierz inny.",
  },
  en: {
    cancel: "Cancel booking",
    confirmCancel: "Cancel for sure? We'll refund",
    yes: "Yes, cancel",
    no: "Keep it",
    noCancel: "It's less than 24 h to the start, so free cancellation is no longer possible. You can still reschedule.",
    noChange: "It's less than 3 h to the start. Changes are no longer possible.",
    reschedule: "Reschedule",
    pickDay: "New day",
    pickTime: "New time",
    none: "No free slots that day for this type of rig.",
    save: "Save new time",
    saved: "Saved. We've emailed you a confirmation.",
    cancelled: "Booking cancelled.",
    error: "That didn't work. The slot may have been taken – pick another.",
  },
};

const fmtTime = (iso: string) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: SITE.timezone }).format(new Date(iso));

export default function ManageBooking({ b, sig, lang, canCancel, canReschedule, refund }: { b: B; sig?: string; lang: "pl" | "en"; canCancel: boolean; canReschedule: boolean; refund: number }) {
  const t = T[lang];
  const [confirm, setConfirm] = useState(false);
  const [mode, setMode] = useState<"idle" | "move">("idle");
  const [dates, setDates] = useState<{ date: string; open: boolean }[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<{ start: string; free: string[] }[] | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const group = simById(b.simulatorId)?.priceGroup;

  useEffect(() => {
    if (mode !== "move") return;
    fetch("/api/availability").then((r) => r.json()).then((d) => {
      setDates(d.dates);
      setDate(d.dates.find((x: { open: boolean }) => x.open)?.date ?? null);
    });
  }, [mode]);
  useEffect(() => {
    if (!date) return;
    setSlots(null);
    fetch(`/api/availability?date=${date}&duration=${b.durationMin}`).then((r) => r.json()).then((d) => {
      // tylko godziny, w których wolne jest to samo stanowisko albo inne z tej samej grupy cenowej
      setSlots((d.slots ?? []).filter((s: { free: string[] }) => s.free.some((id) => simById(id)?.priceGroup === group)));
    });
  }, [date, b.durationMin, group]);

  const doCancel = async () => {
    const r = await fetch(`/api/bookings/${b.id}/cancel`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ s: sig }) });
    setConfirm(false);
    if (r.ok) {
      setMsg({ ok: true, text: t.cancelled });
      setTimeout(() => location.reload(), 900);
    } else setMsg({ ok: false, text: t.error });
  };
  const doMove = async () => {
    const slot = slots?.find((s) => s.start === pick);
    if (!slot) return;
    const simulatorId = slot.free.includes(b.simulatorId) ? b.simulatorId : slot.free.find((id) => simById(id)?.priceGroup === group);
    const r = await fetch(`/api/bookings/${b.id}/reschedule`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ start: pick, simulatorId, s: sig }) });
    if (r.ok) {
      setMsg({ ok: true, text: t.saved });
      setTimeout(() => location.reload(), 900);
    } else setMsg({ ok: false, text: t.error });
  };

  if (b.status !== "PAID") return null;
  return (
    <div style={{ display: "grid", gap: 18, marginTop: 30 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {canReschedule && (
          <button className="btn-white" type="button" onClick={() => setMode(mode === "move" ? "idle" : "move")}>
            {t.reschedule}
          </button>
        )}
        {canCancel && (
          <button className="btn-ghost" style={{ height: 54 }} type="button" onClick={() => setConfirm(true)}>
            {t.cancel}
          </button>
        )}
      </div>
      {!canCancel && canReschedule && <p style={{ color: "var(--muted)", fontSize: 14 }}>{t.noCancel}</p>}
      {!canReschedule && <p style={{ color: "var(--muted)", fontSize: 14 }}>{t.noChange}</p>}
      {confirm && (
        <div className="glass" style={{ padding: 20, display: "grid", gap: 14, maxWidth: 520 }} role="alertdialog" aria-label={t.cancel}>
          <p>
            {t.confirmCancel} {(refund / 100).toFixed(0)} zł.
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn-white" type="button" onClick={doCancel}>{t.yes}</button>
            <button className="btn-ghost" style={{ height: 54 }} type="button" onClick={() => setConfirm(false)}>{t.no}</button>
          </div>
        </div>
      )}
      {mode === "move" && (
        <div className="glass" style={{ padding: 20, display: "grid", gap: 16 }}>
          <span className="eyebrow">{t.pickDay}</span>
          <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
            {dates.map((d) => (
              <button key={d.date} type="button" disabled={!d.open} onClick={() => setDate(d.date)} className="chip" style={date === d.date ? { background: "#fff", color: "#000" } : undefined}>
                {d.date.slice(5).split("-").reverse().join(".")}
              </button>
            ))}
          </div>
          <span className="eyebrow">{t.pickTime}</span>
          {slots && slots.length === 0 && <p style={{ color: "var(--muted)" }}>{t.none}</p>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {slots?.map((s) => (
              <button key={s.start} type="button" className="chip" onClick={() => setPick(s.start)} style={pick === s.start ? { background: "#fff", color: "#000" } : undefined}>
                {fmtTime(s.start)}
              </button>
            ))}
          </div>
          <div>
            <button className="btn-white" type="button" disabled={!pick} onClick={doMove}>{t.save}</button>
          </div>
        </div>
      )}
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
    </div>
  );
}
