import { Prisma } from "@prisma/client";
import { BOOKING, HOURS, SIMULATORS } from "@/config/site";
import { prisma } from "./db";
import { serviceBlocks, services } from "./sims";
import { addDays, dowOf, MIN, todayWarsaw, warsaw, zoned } from "./time";

type Tx = Prisma.TransactionClient | typeof prisma;

/** Rezerwacje, które zajmują stanowisko w danym przedziale. */
export function blockingWhere(now = new Date()): Prisma.BookingWhereInput {
  return {
    OR: [
      { status: { in: ["PAID", "COMPLETED", "NO_SHOW"] } },
      { status: "PENDING", holdExpiresAt: { gt: now } },
    ],
  };
}

export function dayWindow(dateStr: string) {
  const h = HOURS[dowOf(dateStr)];
  if (!h) return null;
  return { open: warsaw(dateStr, h.open), close: warsaw(dateStr, h.close) };
}

export function bookableDates() {
  const today = todayWarsaw();
  const out: { date: string; open: boolean }[] = [];
  for (let i = 0; i <= BOOKING.maxDaysAhead; i++) {
    const date = addDays(today, i);
    out.push({ date, open: !!HOURS[dowOf(date)] });
  }
  return out;
}

export function isDateBookable(dateStr: string) {
  return bookableDates().some((d) => d.date === dateStr && d.open);
}

export type DayAvailability = {
  date: string;
  duration: number;
  slots: { start: string; free: string[] }[]; // start ISO + lista wolnych stanowisk
};

export async function dayAvailability(dateStr: string, duration: number, now = new Date()): Promise<DayAvailability> {
  const win = dayWindow(dateStr);
  const result: DayAvailability = { date: dateStr, duration, slots: [] };
  if (!win || !isDateBookable(dateStr)) return result;

  const active = SIMULATORS.filter((s) => s.status === "ACTIVE").map((s) => s.id);
  const service = await services(now);
  const pad = BOOKING.bufferMin * MIN;
  const existing = await prisma.booking.findMany({
    where: {
      AND: [blockingWhere(now), { simulatorId: { in: active } }, { start: { lt: new Date(win.close.getTime() + pad) } }, { end: { gt: new Date(win.open.getTime() - pad) } }],
    },
    select: { simulatorId: true, start: true, end: true },
  });

  const earliest = now.getTime() + BOOKING.minLeadMin * MIN;
  for (let t = win.open.getTime(); t + duration * MIN <= win.close.getTime(); t += BOOKING.slotStepMin * MIN) {
    if (t < earliest) continue;
    const s = t;
    const e = t + duration * MIN;
    const free = active.filter(
      (sim) => !serviceBlocks(service, sim, new Date(s)) && !existing.some((b) => b.simulatorId === sim && b.start.getTime() < e + pad && b.end.getTime() + pad > s),
    );
    if (free.length) result.slots.push({ start: new Date(s).toISOString(), free });
  }
  return result;
}

export async function isFree(tx: Tx, simulatorId: string, start: Date, end: Date, excludeId?: string, now = new Date()) {
  const pad = BOOKING.bufferMin * MIN;
  const clash = await tx.booking.findFirst({
    where: {
      AND: [
        blockingWhere(now),
        { simulatorId },
        { start: { lt: new Date(end.getTime() + pad) } },
        { end: { gt: new Date(start.getTime() - pad) } },
        excludeId ? { id: { not: excludeId } } : {},
      ],
    },
    select: { id: true },
  });
  return !clash;
}

/** Czy start mieści się w godzinach otwarcia i regułach wyprzedzenia. */
export function validStart(start: Date, duration: number, now = new Date(), ignoreLead = false) {
  if (!BOOKING.durations.includes(duration as never)) return false;
  if (!ignoreLead && start.getTime() < now.getTime() + BOOKING.minLeadMin * MIN) return false;
  const { dateStr } = zonedDate(start);
  const win = dayWindow(dateStr);
  if (!win) return false;
  if (start < win.open || start.getTime() + duration * MIN > win.close.getTime()) return false;
  if ((start.getTime() - win.open.getTime()) % (BOOKING.slotStepMin * MIN) !== 0) return false;
  return ignoreLead || isDateBookable(dateStr);
}

function zonedDate(d: Date) {
  // sesja zaczynająca się po północy (np. 00:00 przy zamknięciu 24:00) należy do poprzedniego dnia otwarcia
  const z = zoned(d);
  if (z.hh < 6) return { dateStr: addDays(z.dateStr, -1) };
  return { dateStr: z.dateStr };
}
