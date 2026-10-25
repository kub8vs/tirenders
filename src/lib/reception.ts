import type { Booking } from "@prisma/client";
import { simById } from "@/config/site";
import { prisma } from "./db";
import { addDays, fmtDate, fmtTime, todayWarsaw, warsaw } from "./time";

/** Rezerwacja w kształcie dla recepcji (bez kwot). */
export type DeskRow = {
  id: string;
  code: string;
  groupId: string | null;
  simulatorId: string;
  sim: string;
  name: string;
  phone: string;
  start: string;
  end: string;
  date: string;
  from: string;
  to: string;
  durationMin: number;
  status: string;
  checkedInAt: string | null;
  checkedInBy: string | null;
  source: string;
  note: string | null;
};

export function deskRow(b: Booking): DeskRow {
  return {
    id: b.id,
    code: b.code,
    groupId: b.groupId,
    simulatorId: b.simulatorId,
    sim: simById(b.simulatorId)?.name ?? b.simulatorId,
    name: b.name,
    phone: b.phone,
    start: b.start.toISOString(),
    end: b.end.toISOString(),
    date: fmtDate(b.start, "pl", { weekday: "short", day: "numeric", month: "numeric" }),
    from: fmtTime(b.start),
    to: fmtTime(b.end),
    durationMin: b.durationMin,
    status: b.status,
    checkedInAt: b.checkedInAt?.toISOString() ?? null,
    checkedInBy: b.checkedInBy,
    source: b.source,
    note: b.note,
  };
}

/** Wszyscy goście danego dnia (doba salonu kończy się o 6:00 rano następnego dnia). */
export async function dayDesk(date = todayWarsaw()) {
  const list = await prisma.booking.findMany({
    where: {
      start: { gte: warsaw(date, "00:00"), lt: warsaw(addDays(date, 1), "06:00") },
      OR: [{ status: { in: ["PAID", "COMPLETED", "NO_SHOW"] } }, { status: "PENDING", source: "ADMIN" }],
    },
    orderBy: { start: "asc" },
  });
  return list.map(deskRow);
}

/** Lista dnia dla recepcji: Excel z arkuszem na każde stanowisko + ta sama lista w treści maila. */
export async function deskMail(date: string) {
  const ExcelJS = (await import("exceljs")).default;
  const { SIMULATORS } = await import("@/config/site");
  const rows = (await dayDesk(date)).filter((b) => b.status !== "PENDING");
  const sims = SIMULATORS.filter((s) => s.status === "ACTIVE" || rows.some((b) => b.simulatorId === s.id));
  const wb = new ExcelJS.Workbook();
  let html = "";
  for (const s of sims) {
    const list = rows.filter((b) => b.simulatorId === s.id);
    const ws = wb.addWorksheet(s.name.slice(0, 31));
    ws.columns = [
      { header: "Godzina", key: "t", width: 14 },
      { header: "Imię i nazwisko", key: "n", width: 30 },
      { header: "Kod", key: "c", width: 10 },
      { header: "Czas", key: "d", width: 9 },
      { header: "Telefon", key: "p", width: 16 },
      { header: "Przyszedł", key: "x", width: 11 },
    ];
    ws.getRow(1).font = { bold: true };
    for (const b of list) ws.addRow({ t: `${b.from}–${b.to}`, n: b.name, c: b.code, d: `${b.durationMin} min`, p: b.phone, x: "" });
    html += `<h3 style="color:#fff;margin:22px 0 8px">${s.name} (${list.length})</h3>`;
    html += list.length
      ? `<table style="width:100%;border-collapse:collapse;font-size:13px">${list.map((b) => `<tr><td style="padding:6px 8px 6px 0;border-bottom:1px solid #222;white-space:nowrap">${b.from}–${b.to}</td><td style="padding:6px 8px;border-bottom:1px solid #222;color:#fff">${b.name}</td><td style="padding:6px 8px;border-bottom:1px solid #222;letter-spacing:.12em">${b.code}</td><td style="padding:6px 0;border-bottom:1px solid #222">${b.phone}</td></tr>`).join("")}</table>`
      : `<p style="margin:0">Brak rezerwacji</p>`;
  }
  return { count: rows.length, html, buffer: Buffer.from(await wb.xlsx.writeBuffer()) };
}
