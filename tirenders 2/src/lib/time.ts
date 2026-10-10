import { SITE } from "@/config/site";

const TZ = SITE.timezone;

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  weekday: "short",
});

const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function zoned(date: Date) {
  const p: Record<string, string> = {};
  for (const x of partsFmt.formatToParts(date)) p[x.type] = x.value;
  return {
    y: +p.year,
    m: +p.month,
    d: +p.day,
    hh: +p.hour,
    mm: +p.minute,
    ss: +p.second,
    dow: DOW[p.weekday],
    dateStr: `${p.year}-${p.month}-${p.day}`,
    timeStr: `${p.hour}:${p.minute}`,
  };
}

function offsetMs(date: Date) {
  const z = zoned(date);
  const asUtc = Date.UTC(z.y, z.m - 1, z.d, z.hh, z.mm, z.ss);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** "2026-11-15" + "18:30" (czas warszawski) → Date (UTC). Obsługuje "24:00". */
export function warsaw(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  let [hh, mm] = timeStr.split(":").map(Number);
  let extraDay = 0;
  if (hh >= 24) {
    hh -= 24;
    extraDay = 1;
  }
  const guess = Date.UTC(y, m - 1, d + extraDay, hh, mm);
  let t = guess - offsetMs(new Date(guess));
  t = guess - offsetMs(new Date(t));
  return new Date(t);
}

export function todayWarsaw() {
  return zoned(new Date()).dateStr;
}

export function addDays(dateStr: string, n: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

export function dowOf(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function fmtDate(date: Date, locale: string, opts: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "pl-PL", { timeZone: TZ, ...opts }).format(date);
}

export function fmtTime(date: Date) {
  return zoned(date).timeStr;
}

export function fmtLong(date: Date, locale: string) {
  return fmtDate(date, locale, { weekday: "long", day: "numeric", month: "long" }) + ", " + fmtTime(date);
}

export const MIN = 60_000;
