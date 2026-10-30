import { HOURS, SIMULATORS } from "@/config/site";
import { prisma } from "./db";
import { reportData, type Range } from "./report";
import { addDays, dowOf, MIN, todayWarsaw, warsaw, zoned } from "./time";

const LIVE = ["PAID", "COMPLETED", "NO_SHOW"];

/** Liczby za okres (daty włącznie) do pulpitu i finansów. */
export async function periodStats(r: Range) {
  const d = await reportData(r);
  const live = d.paid.filter((b) => LIVE.includes(b.status));
  const minutes = live.reduce((s, b) => s + b.durationMin, 0);
  const activeSims = SIMULATORS.filter((s) => s.status === "ACTIVE").length || 1;
  return {
    ...d,
    live,
    count: live.length,
    minutes,
    avg: live.length ? Math.round(d.revenueGross / live.length) : 0,
    noShow: live.filter((b) => b.status === "NO_SHOW").length,
    checkedIn: live.filter((b) => b.checkedInAt).length,
    refunds: d.cancellations.reduce((s, b) => s + b.refundAmount, 0),
    occupancyAll: d.openMin ? minutes / (d.openMin * activeSims) : 0,
  };
}

/** Okres o tej samej długości tuż przed podanym (do porównań „w górę / w dół”). */
export function previous(r: Range): Range {
  const days = Math.round((warsaw(r.to, "12:00").getTime() - warsaw(r.from, "12:00").getTime()) / 86_400_000) + 1;
  return { from: addDays(r.from, -days), to: addDays(r.from, -1) };
}

export function weekRange(date = todayWarsaw()): Range {
  const dow = dowOf(date);
  return { from: addDays(date, -((dow + 6) % 7)), to: date };
}
export function monthToDate(date = todayWarsaw()): Range {
  return { from: date.slice(0, 8) + "01", to: date };
}
export const lastDays = (n: number, date = todayWarsaw()): Range => ({ from: addDays(date, -(n - 1)), to: date });

/** Przychód i liczba rezerwacji dzień po dniu. */
export async function dailySeries(r: Range) {
  const list = await prisma.booking.findMany({
    where: { start: { gte: warsaw(r.from, "00:00"), lt: warsaw(addDays(r.to, 1), "00:00") }, status: { in: [...LIVE, "CANCELLED", "REFUNDED"] }, paidAt: { not: null } },
    select: { start: true, priceGross: true, refundAmount: true, status: true },
  });
  const out: { date: string; gross: number; count: number }[] = [];
  for (let d = r.from; d <= r.to; d = addDays(d, 1)) out.push({ date: d, gross: 0, count: 0 });
  const idx = new Map(out.map((x, i) => [x.date, i]));
  for (const b of list) {
    const i = idx.get(zoned(b.start).dateStr);
    if (i === undefined) continue;
    out[i].gross += b.priceGross - b.refundAmount;
    if (LIVE.includes(b.status)) out[i].count++;
  }
  return out;
}

/** Mapa ciepła: ile rezerwacji startuje w danym dniu tygodnia i godzinie. */
export function heatmap(list: { start: Date }[]) {
  const grid = Array.from({ length: 7 }, () => Array<number>(24).fill(0));
  for (const b of list) {
    const z = zoned(b.start);
    grid[z.dow][z.hh]++;
  }
  const hours = new Set<number>();
  for (const h of Object.values(HOURS)) if (h) for (let x = +h.open.slice(0, 2); x < Math.min(24, +h.close.slice(0, 2)); x++) hours.add(x);
  return { grid, hours: [...hours].sort((a, b) => a - b), max: Math.max(1, ...grid.flat()) };
}

/** Minuty otwarcia salonu w okresie (na jedno stanowisko). */
export function openMinutes(r: Range) {
  let m = 0;
  for (let d = r.from; d <= r.to; d = addDays(d, 1)) {
    const h = HOURS[dowOf(d)];
    if (h) m += (warsaw(d, h.close).getTime() - warsaw(d, h.open).getTime()) / MIN;
  }
  return m;
}

export const pct = (x: number) => `${Math.round(x * 100)}%`;
export function trend(now: number, before: number) {
  if (!before) return now ? { cls: "up", text: "nowe" } : { cls: "", text: "bez zmian" };
  const p = Math.round(((now - before) / before) * 100);
  return { cls: p > 0 ? "up" : p < 0 ? "down" : "", text: `${p > 0 ? "+" : ""}${p}% vs poprzedni okres` };
}
