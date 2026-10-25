import { unstable_cache } from "next/cache";
import { SIMULATORS, type SimDef } from "@/config/site";
import { prisma } from "./db";

// Stanowiska wyłączone na serwis w panelu. Cennik i opisy są w src/config/site.ts,
// a tu tylko to, co obsługa zmienia na bieżąco.
export type Service = { id: string; note: string | null; until: Date | null; by: string | null };

export const SIMS_TAG = "sims";

const load = unstable_cache(
  async () => {
    const rows = await prisma.simulator.findMany({
      where: { status: "OUT_OF_SERVICE" },
      select: { id: true, serviceNote: true, serviceUntil: true, serviceBy: true },
    });
    return rows.map((r) => ({ id: r.id, note: r.serviceNote, until: r.serviceUntil?.toISOString() ?? null, by: r.serviceBy }));
  },
  ["sims-service"],
  { tags: [SIMS_TAG], revalidate: 30 },
);

/** Serwisy, które jeszcze trwają (te z minioną datą „do” same się kończą). */
export async function services(now = new Date()): Promise<Service[]> {
  const rows = await load();
  return rows
    .map((r) => ({ ...r, until: r.until ? new Date(r.until) : null }))
    .filter((r) => !r.until || r.until > now);
}

/** Czy jazda od „start” wypada w serwisie. Serwis trwa od teraz do „until” albo do odwołania. */
export function serviceBlocks(list: Service[], simulatorId: string, start: Date) {
  const s = list.find((x) => x.id === simulatorId);
  return !!s && (!s.until || start < s.until);
}

/** Stanowiska z konfiguracji ze statusem serwisu z bazy. */
export async function liveSims(now = new Date()): Promise<SimDef[]> {
  const list = await services(now);
  return SIMULATORS.map((s) => (s.status === "ACTIVE" && list.some((x) => x.id === s.id) ? { ...s, status: "OUT_OF_SERVICE" as const } : s));
}

/** Opłacone i czekające na płatność jazdy, które wypadają w czasie serwisu. Obsługa musi je przenieść albo odwołać. */
export async function affectedBookings(simulatorId: string, until: Date | null, now = new Date()) {
  return prisma.booking.findMany({
    where: {
      simulatorId,
      start: { gte: new Date(now.getTime() - 60 * 60_000), ...(until ? { lt: until } : {}) },
      end: { gt: now },
      OR: [{ status: "PAID" }, { status: "PENDING", holdExpiresAt: { gt: now } }],
    },
    orderBy: { start: "asc" },
    select: { id: true, code: true, name: true, phone: true, start: true, durationMin: true, status: true },
  });
}

/** Dane do przełącznika serwisu w panelu: każde działające stanowisko, jego serwis i jazdy do przeniesienia. */
export async function serviceBoard(now = new Date()) {
  const list = await prisma.simulator.findMany({
    where: { status: "OUT_OF_SERVICE" },
    select: { id: true, serviceNote: true, serviceUntil: true, serviceBy: true },
  });
  const live = list.filter((s) => !s.serviceUntil || s.serviceUntil > now);
  return Promise.all(
    SIMULATORS.filter((s) => s.status === "ACTIVE").map(async (s) => {
      const sv = live.find((x) => x.id === s.id);
      return {
        id: s.id,
        name: s.name,
        service: sv ? { note: sv.serviceNote, until: sv.serviceUntil?.toISOString() ?? null, by: sv.serviceBy } : null,
        affected: sv ? (await affectedBookings(s.id, sv.serviceUntil, now)).map((b) => ({ ...b, start: b.start.toISOString() })) : [],
      };
    }),
  );
}
export type ServiceRow = Awaited<ReturnType<typeof serviceBoard>>[number];
