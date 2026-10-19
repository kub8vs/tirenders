"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BOOKING, GROUP_DISCOUNTS, PRICES, SIMULATORS, SITE, WHOLE_SALON_PERCENT, activeSims, groupPercent, simById, type SimDef } from "@/config/site";
import SalonPlan from "./SalonPlan";

type Slot = { start: string; free: string[] };
type Prefill = { name: string; email: string; phone: string } | null;

const T = {
  pl: {
    step1: "Ile jedziesz?",
    longer: "Dłużej niż 90 min albo cały salon na wyłączność? Zadzwoń:",
    step2: "Kiedy?",
    pickHour: "Godzina",
    closed: "zamknięte",
    step3: "O której?",
    noSlots: "Na ten dzień nie ma już wolnych terminów. Wybierz inny dzień.",
    loading: "Sprawdzam wolne terminy…",
    step4: "Wybierz stanowisko",
    promoTitle: "Jedziecie ekipą? Taniej.",
    promoLead: "Zaznacz kilka stanowisk na tę samą godzinę, a rabat naliczy się sam.",
    promoTiers: [`${GROUP_DISCOUNTS[0].min}+ stanowiska`, `${GROUP_DISCOUNTS[1].min}+ stanowisk`, "Cały salon (telefonicznie)"],
    promoNext: (n: number, p: number) => `Dobierz jeszcze ${n} ${n === 1 ? "stanowisko" : "stanowiska"}, a rabat wzrośnie do ${p}%.`,
    promoOn: (p: number) => `Rabat grupowy −${p}% naliczony.`,
    wholeSalon: "Cały salon na wyłączność rezerwujemy tylko telefonicznie. Zadzwoń na infolinię: obsługa zarezerwuje termin i wyśle Ci SMS-em link do płatności.",
    callUs: "Zadzwoń na infolinię",
    clear: "Wyczyść",
    groupDisc: "Rabat grupowy",
    codeWeaker: "Kod działa, ale rabat grupowy jest większy, więc liczymy grupowy.",
    rigs: "Stanowiska",
    pickTime: "Najpierw wybierz godzinę: pokażemy, co jest wtedy wolne.",
    step5: "Twoje dane",
    name: "Imię i nazwisko",
    email: "E-mail",
    phone: "Telefon (SMS z przypomnieniem)",
    code: "Kod rabatowy",
    apply: "Użyj",
    codeOk: "Kod działa",
    codeBad: "Ten kod nie działa albo wygasł",
    terms1: "Akceptuję ",
    terms2: "regulamin",
    terms3: ` i zasady odwołania: bez kosztów do ${BOOKING.freeCancelHours} h przed, później tylko zmiana terminu (do ${BOOKING.rescheduleHours} h przed).`,
    summary: "Podsumowanie",
    pay: "Przejdź do płatności",
    paying: "Łączę z płatnością…",
    hold: "Po kliknięciu trzymamy ten termin 10 minut, aż zapłacisz.",
    methods: "BLIK · karta · Apple Pay · Google Pay · Przelewy24",
    total: "Do zapłaty",
    discount: "Rabat",
    taken: "Ktoś był szybszy i zajął ten termin. Wybierz inną godzinę albo stanowisko.",
    tooMany: "Masz już kilka nieopłaconych rezerwacji. Dokończ płatność albo poczekaj 10 minut.",
    rate: "Za dużo prób w krótkim czasie. Odczekaj minutę i spróbuj ponownie.",
    invalid: "Sprawdź dane w formularzu.",
    server: "Coś poszło nie tak po naszej stronie. Spróbuj ponownie za chwilę.",
    change: "zmień",
    min: "min",
    account: "Masz konto? Zaloguj się, a rezerwacja trafi do Twojego profilu.",
    signin: "Zaloguj się",
  },
  en: {
    step1: "How long are you driving?",
    longer: "Longer than 90 min or the whole venue to yourself? Call us:",
    step2: "When?",
    pickHour: "Time",
    closed: "closed",
    step3: "What time?",
    noSlots: "No free slots left on this day. Pick another day.",
    loading: "Checking free slots…",
    step4: "Choose your rig",
    promoTitle: "Coming as a crew? It's cheaper.",
    promoLead: "Pick several rigs for the same time and the discount applies on its own.",
    promoTiers: [`${GROUP_DISCOUNTS[0].min}+ rigs`, `${GROUP_DISCOUNTS[1].min}+ rigs`, "Whole venue (by phone)"],
    promoNext: (n: number, p: number) => `Add ${n} more ${n === 1 ? "rig" : "rigs"} and the discount goes up to ${p}%.`,
    promoOn: (p: number) => `Group discount −${p}% applied.`,
    wholeSalon: "The whole venue is booked by phone only. Call our hotline: our team will book it and text you a payment link.",
    callUs: "Call our hotline",
    clear: "Clear",
    groupDisc: "Group discount",
    codeWeaker: "The code works, but the group discount is bigger, so we use that.",
    rigs: "Rigs",
    pickTime: "Pick a time first: we'll show what's free then.",
    step5: "Your details",
    name: "Full name",
    email: "Email",
    phone: "Phone (SMS reminder)",
    code: "Discount code",
    apply: "Apply",
    codeOk: "Code applied",
    codeBad: "This code doesn't work or has expired",
    terms1: "I accept the ",
    terms2: "terms",
    terms3: ` and the cancellation policy: free up to ${BOOKING.freeCancelHours} h before, after that reschedule only (up to ${BOOKING.rescheduleHours} h before).`,
    summary: "Summary",
    pay: "Continue to payment",
    paying: "Connecting to payment…",
    hold: "Once you click, we hold this slot for 10 minutes while you pay.",
    methods: "BLIK · card · Apple Pay · Google Pay · Przelewy24",
    total: "Total",
    discount: "Discount",
    taken: "Someone was faster and took this slot. Pick another time or rig.",
    tooMany: "You already have a few unpaid bookings. Finish paying or wait 10 minutes.",
    rate: "Too many attempts in a short time. Wait a minute and try again.",
    invalid: "Check the form details.",
    server: "Something went wrong on our side. Try again in a moment.",
    change: "change",
    min: "min",
    account: "Have an account? Sign in and the booking lands in your profile.",
    signin: "Sign in",
  },
};

const fmtDay = (d: string, l: string) => {
  const [y, m, dd] = d.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, dd, 12));
  return {
    wd: new Intl.DateTimeFormat(l === "en" ? "en-GB" : "pl-PL", { weekday: "short", timeZone: "UTC" }).format(dt),
    day: dd,
    mon: new Intl.DateTimeFormat(l === "en" ? "en-GB" : "pl-PL", { month: "short", timeZone: "UTC" }).format(dt),
  };
};
const fmtTime = (iso: string) => new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: SITE.timezone }).format(new Date(iso));

export default function BookingFlow({ lang, prefill, initialSim, signedIn }: { lang: "pl" | "en"; prefill: Prefill; initialSim?: string; signedIn: boolean }) {
  const t = T[lang];
  const [duration, setDuration] = useState<number>(30);
  const [dates, setDates] = useState<{ date: string; open: boolean }[]>([]);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [start, setStart] = useState<string | null>(null);
  const [sims, setSims] = useState<string[]>(initialSim && simById(initialSim)?.status === "ACTIVE" ? [initialSim] : []);
  const toggleSim = (id: string) => setSims((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  // Cały salon można zaznaczyć, ale zapłacić online nie: rezerwuje go obsługa po telefonie (panel → Rezerwacja telefoniczna).
  const wholeSalon = sims.length >= activeSims().length;
  const [form, setForm] = useState({ name: prefill?.name ?? "", email: prefill?.email ?? "", phone: prefill?.phone ?? "", code: "", terms: false });
  const [quote, setQuote] = useState<{ list: number; discount: number; total: number; codeValid: boolean | null; codeApplied: boolean; groupPercent: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => r.json())
      .then((d) => {
        setDates(d.dates);
        setDate(d.dates.find((x: { open: boolean }) => x.open)?.date ?? null);
      });
  }, []);

  const loadSlots = useCallback(() => {
    if (!date) return;
    setSlots(null);
    fetch(`/api/availability?date=${date}&duration=${duration}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []));
  }, [date, duration]);
  useEffect(loadSlots, [loadSlots]);

  // wybrana godzina musi istnieć w nowych slotach; wybrane stanowisko musi być wtedy wolne
  const slot = useMemo(() => slots?.find((s) => s.start === start) ?? null, [slots, start]);
  useEffect(() => {
    if (slots && start && !slot) setStart(null);
  }, [slots, start, slot]);
  useEffect(() => {
    if (slot && sims.some((x) => !slot.free.includes(x))) setSims((cur) => cur.filter((x) => slot.free.includes(x)));
  }, [slot, sims]);

  // godziny, w których wybrane stanowisko jest zajęte, zostają widoczne, ale przygaszone
  const visibleSlots = slots ?? [];

  const refreshQuote = useCallback(
    (code?: string) => {
      if (!sims.length) return setQuote(null);
      const c = code ?? form.code;
      fetch(`/api/quote?sims=${sims.join(",")}&duration=${duration}${c ? `&code=${encodeURIComponent(c)}` : ""}`)
        .then((r) => r.json())
        .then(setQuote);
    },
    [sims, duration, form.code],
  );
  useEffect(() => {
    refreshQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sims.join(","), duration]);

  const price = (s: SimDef) => PRICES[s.priceGroup][duration as 15];
  const ready = !!(start && sims.length && form.name.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email) && form.phone.replace(/\D/g, "").length >= 9 && form.terms);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || busy || wholeSalon) return;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ simulatorIds: sims, start, durationMin: duration, name: form.name, email: form.email, phone: form.phone, discountCode: quote?.codeApplied ? form.code : null, terms: true, lang }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok && d.checkoutUrl) {
      window.location.href = d.checkoutUrl;
      return;
    }
    setBusy(false);
    if (d.error === "slot_taken" || d.error === "closed") {
      setError(t.taken);
      setStart(null);
      loadSlots();
    } else if (d.error === "too_many_holds") setError(t.tooMany);
    else if (d.error === "rate") setError(t.rate);
    else if (d.error === "whole_salon") setError(t.wholeSalon);
    else if (d.error === "invalid") setError(t.invalid);
    else setError(t.server);
  };

  const picked = sims.map((x) => simById(x)!).filter(Boolean);
  const nActive = activeSims().length;
  const pct = groupPercent(sims.length);
  // następny próg rabatu: ile stanowisk brakuje i ile wtedy procent
  const nextTier = GROUP_DISCOUNTS.map((t) => ({ min: t.min, percent: t.percent })).find((t) => t.min > sims.length && t.min < nActive && t.percent > pct);

  return (
    <form className="bk" onSubmit={submit} noValidate>
      <div className="bk-main">
        <section className="bk-step">
          <h2>
            <span>01</span>
            {t.step1}
          </h2>
          <div className="chips" role="radiogroup" aria-label={t.step1}>
            {BOOKING.durations.map((d) => (
              <button type="button" role="radio" aria-checked={duration === d} key={d} className={`opt ${duration === d ? "on" : ""}`} onClick={() => setDuration(d)}>
                <b>{d}</b> {t.min}
              </button>
            ))}
          </div>
        </section>

        <section className="bk-step">
          <h2>
            <span>02</span>
            {t.step2}
          </h2>
          <div className="days" role="radiogroup" aria-label={t.step2}>
            {dates.map((d) => {
              const f = fmtDay(d.date, lang);
              return (
                <button type="button" role="radio" aria-checked={date === d.date} disabled={!d.open} key={d.date} className={`day ${date === d.date ? "on" : ""}`} onClick={() => setDate(d.date)}>
                  <small>{f.wd}</small>
                  <b>{f.day}</b>
                  <small>{d.open ? f.mon : t.closed}</small>
                </button>
              );
            })}
          </div>
          <p className="bk-sub">{t.pickHour}</p>
          {slots === null ? (
            <p className="hint">{t.loading}</p>
          ) : visibleSlots.length === 0 ? (
            <p className="hint">{t.noSlots}</p>
          ) : (
            <div className="times" role="radiogroup" aria-label={t.step3}>
              {visibleSlots.map((x) => {
                const off = sims.some((q) => !x.free.includes(q));
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={start === x.start}
                    key={x.start}
                    className={`time ${start === x.start ? "on" : ""} ${off ? "dim" : ""}`}
                    onClick={() => setStart(x.start)}
                    title={off ? (lang === "pl" ? "Wybrane stanowisko jest wtedy zajęte" : "Your rig is taken then") : `${x.free.length}`}
                  >
                    {fmtTime(x.start)}
                    <i>{x.free.length}/{SIMULATORS.filter((q) => q.status === "ACTIVE").length}</i>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="bk-step">
          <h2>
            <span>03</span>
            {t.step4}
          </h2>
          {!slot && <p className="hint">{t.pickTime}</p>}
          <div className={`promo ${pct ? "on" : ""}`}>
            <div className="promo-head">
              <b>{t.promoTitle}</b>
              <span>{t.promoLead}</span>
            </div>
            <ol className="promo-tiers">
              {[GROUP_DISCOUNTS[0].percent, GROUP_DISCOUNTS[1].percent, WHOLE_SALON_PERCENT].map((p, i) => (
                <li key={p} className={pct >= p ? "hit" : ""}>
                  <b>−{p}%</b>
                  <span>{t.promoTiers[i]}</span>
                </li>
              ))}
            </ol>
            <p className="promo-state">
              {pct ? t.promoOn(pct) : ""} {nextTier && sims.length > 0 ? t.promoNext(nextTier.min - sims.length, nextTier.percent) : ""}
            </p>
            {slot && sims.length > 1 && (
              <div className="promo-actions">
                <button type="button" className="btn-ghost" onClick={() => setSims([])}>
                  {t.clear}
                </button>
              </div>
            )}
          </div>
          <div className="bk-plan">
            <SalonPlan free={slot ? slot.free : null} selected={sims} onSelect={toggleSim} price={price} lang={lang} />
          </div>
          {picked.length === 1 && <p className="hint" style={{ marginTop: 14 }}>{picked[0].body[lang]}</p>}
        </section>

        <section className="bk-step">
          <h2>
            <span>04</span>
            {t.step5}
          </h2>
          {!signedIn && (
            <p className="hint" style={{ marginBottom: 16 }}>
              {t.account} <Link href="/konto/logowanie?next=/rezerwacja" style={{ textDecoration: "underline" }}>{t.signin}</Link>
            </p>
          )}
          <div className="form-grid">
            <div className="field">
              <label htmlFor="bk-name">{t.name}</label>
              <input id="bk-name" className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="bk-email">{t.email}</label>
              <input id="bk-email" className="input" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="bk-phone">{t.phone}</label>
              <input id="bk-phone" className="input" type="tel" autoComplete="tel" placeholder="+48 …" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            </div>
            <div className="field">
              <label htmlFor="bk-code">{t.code}</label>
              <div style={{ display: "flex", gap: 8 }}>
                <input id="bk-code" className="input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                <button type="button" className="btn-ghost" style={{ height: 52 }} onClick={() => refreshQuote()} disabled={!sims.length || !form.code}>
                  {t.apply}
                </button>
              </div>
              {quote?.codeValid === true && (quote.codeApplied ? <span className="ok">{t.codeOk}</span> : <span className="hint" style={{ marginTop: 6 }}>{t.codeWeaker}</span>)}
              {quote?.codeValid === false && <span className="err">{t.codeBad}</span>}
            </div>
          </div>
          <label className="check" style={{ marginTop: 20 }}>
            <input id="bk-terms" type="checkbox" checked={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.checked })} />
            <span>
              {t.terms1}
              <Link href="/regulamin" target="_blank" style={{ textDecoration: "underline" }}>
                {t.terms2}
              </Link>
              {t.terms3}
            </span>
          </label>
        </section>
      </div>

      <aside className="bk-side">
        <div className="bk-sum glass">
          <p className="eyebrow">{t.summary}</p>
          <dl>
            <div>
              <dt>{lang === "pl" ? "Czas" : "Duration"}</dt>
              <dd>{duration} min</dd>
            </div>
            <div>
              <dt>{lang === "pl" ? "Dzień" : "Day"}</dt>
              <dd>{date ? `${fmtDay(date, lang).wd} ${fmtDay(date, lang).day} ${fmtDay(date, lang).mon}` : "—"}</dd>
            </div>
            <div>
              <dt>{lang === "pl" ? "Godzina" : "Time"}</dt>
              <dd>{start ? fmtTime(start) : "—"}</dd>
            </div>
            <div>
              <dt>{picked.length > 1 ? `${t.rigs} (${picked.length})` : lang === "pl" ? "Stanowisko" : "Rig"}</dt>
              <dd>{picked.length ? picked.map((x) => x.name).join(", ") : "—"}</dd>
            </div>
            {!!quote?.discount && (
              <div>
                <dt>{quote.groupPercent ? `${t.groupDisc} −${quote.groupPercent}%` : t.discount}</dt>
                <dd>−{(quote.discount / 100).toFixed(0)} zł</dd>
              </div>
            )}
          </dl>
          <div className="bk-total">
            <span>{t.total}</span>
            <b>{quote ? `${(quote.total / 100).toFixed(quote.total % 100 ? 2 : 0)} zł` : "—"}</b>
          </div>
          {error && (
            <p className="err" role="alert">
              {error}
            </p>
          )}
          {wholeSalon ? (
            <div className="whole" role="status">
              <p>{t.wholeSalon}</p>
              {SITE.phone ? (
                <a className="btn-white" href={`tel:${SITE.phone.replace(/\s/g, "")}`} style={{ width: "100%", height: 58 }}>
                  {t.callUs}: {SITE.phone}
                </a>
              ) : (
                <b>{lang === "pl" ? "Numer infolinii wkrótce" : "Hotline number coming soon"}</b>
              )}
            </div>
          ) : (
            <button type="submit" className="btn-white" style={{ width: "100%", height: 58 }} disabled={!ready || busy}>
              {busy ? t.paying : t.pay}
            </button>
          )}
          <p className="hint" style={{ fontSize: 12.5 }}>{t.hold}</p>
          <p className="hint" style={{ fontSize: 12.5 }}>{t.methods}</p>
          <p className="hint" style={{ fontSize: 12.5 }}>
            {t.longer} <b>{SITE.phone ?? (lang === "pl" ? "numer wkrótce" : "number coming soon")}</b>
          </p>
        </div>
      </aside>

      <style jsx>{`
        .bk { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 340px); gap: clamp(24px, 4vw, 64px); align-items: start; }
        .bk-main { display: grid; gap: 48px; min-width: 0; grid-template-columns: minmax(0, 1fr); }
        .bk-step { min-width: 0; }
        .bk-plan { max-width: 560px; }
        .bk-step h2 { font-size: clamp(24px, 2.4vw, 34px); display: flex; gap: 16px; align-items: baseline; margin-bottom: 22px; }
        .bk-step h2 span { font-size: 12px; letter-spacing: .2em; color: var(--muted); }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .opt { height: 56px; padding: 0 22px; border-radius: 999px; border: 1px solid var(--line-2); background: transparent; cursor: pointer; font-size: 14px; color: #bbb; }
        .opt b { font-size: 20px; font-weight: 500; color: #fff; margin-right: 2px; }
        .opt.on { background: #fff; color: #000; border-color: #fff; }
        .opt.on b { color: #000; }
        .hint { color: var(--muted); font-size: 14px; margin-top: 14px; }
        .bk-sub { margin: 26px 0 12px; font-size: 12px; letter-spacing: .2em; text-transform: uppercase; color: var(--muted); }
        .hint b { color: #ddd; font-weight: 500; }
        .days { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 6px; scrollbar-width: thin; }
        .day { flex: 0 0 auto; width: 74px; height: 92px; border-radius: 16px; border: 1px solid var(--line-2); background: #090909; display: grid; place-items: center; align-content: center; gap: 2px; cursor: pointer; }
        .day b { font-size: 26px; font-weight: 500; line-height: 1.1; }
        .whole { display: grid; gap: 14px; padding: 18px; border-radius: 16px; border: 1px solid rgba(255,42,42,.45); background: rgba(255,42,42,.08); }
        .whole p { margin: 0; color: #eee; line-height: 1.5; }
        .whole .btn-white { display: inline-flex; align-items: center; justify-content: center; }
        .day small { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .08em; }
        .day.on { background: #fff; color: #000; border-color: #fff; }
        .day.on small { color: #555; }
        .day:disabled { opacity: .3; cursor: not-allowed; }
        .times { display: grid; grid-template-columns: repeat(auto-fill, minmax(86px, 1fr)); gap: 8px; }
        .time { height: 52px; border-radius: 12px; border: 1px solid var(--line-2); background: #090909; cursor: pointer; font-size: 15px; font-variant-numeric: tabular-nums; display: grid; place-items: center; align-content: center; line-height: 1.1; }
        .time i { font-style: normal; font-size: 10.5px; color: var(--muted); }
        .time.on { background: #fff; color: #000; border-color: #fff; }
        .time.on i { color: #555; }
        .time.dim { opacity: .4; }
        .promo { margin-bottom: 18px; max-width: 560px; border: 1px solid var(--line); border-radius: 18px; padding: 18px; display: grid; gap: 14px; background: radial-gradient(120% 140% at 100% 0%, rgba(255,42,42,.18), transparent 60%), #070707; transition: border-color .3s; }
        .promo.on { border-color: rgba(26,255,90,.45); }
        .promo-head { display: grid; gap: 4px; }
        .promo-head b { font-size: 18px; font-weight: 500; }
        .promo-head span { color: var(--muted); font-size: 14px; }
        .promo-tiers { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
        .promo-tiers li { border: 1px solid var(--line-2); border-radius: 14px; padding: 12px; display: grid; gap: 2px; transition: background .3s, color .3s, border-color .3s; }
        .promo-tiers b { font-size: 22px; font-weight: 500; letter-spacing: -.02em; }
        .promo-tiers span { font-size: 12px; color: var(--muted); }
        .promo-tiers li.hit { background: #fff; color: #000; border-color: #fff; }
        .promo-tiers li.hit span { color: #555; }
        .promo-state { font-size: 13.5px; color: #9ff0c0; min-height: 1.2em; margin: 0; }
        .promo-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .promo-actions :global(.btn-ghost) { height: 44px; }
        .bk-side { position: sticky; top: 100px; min-width: 0; }
        .bk-sum { padding: 24px; display: grid; gap: 16px; }
        dl { margin: 0; display: grid; }
        dl div { display: flex; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--line); font-size: 14px; }
        dt { color: var(--muted); }
        dd { margin: 0; text-align: right; }
        .bk-total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 4px; }
        .bk-total b { font-size: 34px; font-weight: 500; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
        @media (max-width: 980px) { .bk { grid-template-columns: minmax(0, 1fr); } .bk-side { position: static; } }
      `}</style>
    </form>
  );
}
