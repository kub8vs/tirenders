import ExcelJS from "exceljs";
import { HOURS, SIMULATORS, SITE, simById } from "@/config/site";
import { prisma } from "./db";
import { netOf } from "./pricing";
import { addDays, dowOf, fmtDate, fmtTime, MIN, warsaw, zoned } from "./time";

export type Range = { from: string; to: string }; // daty YYYY-MM-DD, "to" włącznie

export function dayRange(date: string): Range {
  return { from: date, to: date };
}
export function monthRange(year: number, month: number): Range {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return { from, to: addDays(next, -1) };
}

const PAY_LABEL: Record<string, string> = { blik: "BLIK", card: "Karta", p24: "Przelewy24", ONSITE: "Na miejscu", TEST: "Test" };
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Oczekuje na płatność",
  PAID: "Opłacona",
  COMPLETED: "Zrealizowana",
  NO_SHOW: "Nieobecność",
  CANCELLED: "Odwołana",
  REFUNDED: "Zwrócona",
  EXPIRED: "Wygasła",
};
const zl = (g: number) => Math.round(g) / 100;

export async function reportData(r: Range) {
  const start = warsaw(r.from, "00:00");
  const end = warsaw(addDays(r.to, 1), "00:00");
  const bookings = await prisma.booking.findMany({
    where: { start: { gte: start, lt: end }, status: { not: "EXPIRED" } },
    orderBy: { start: "asc" },
  });
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: start, lt: end } }, orderBy: { createdAt: "asc" } });
  const paid = bookings.filter((b) => ["PAID", "COMPLETED", "NO_SHOW", "REFUNDED", "CANCELLED"].includes(b.status) && b.paidAt);

  const revenueGross = paid.reduce((s, b) => s + b.priceGross - b.refundAmount, 0);
  const salesGross = sales.reduce((s, x) => s + x.amount, 0);
  const totalGross = revenueGross + salesGross;
  const { net, vat } = netOf(totalGross, SITE.vatRate);

  const byMethod = new Map<string, { count: number; gross: number }>();
  for (const b of paid) {
    const k = PAY_LABEL[b.paymentMethod ?? ""] ?? b.paymentMethod ?? "Inne";
    const v = byMethod.get(k) ?? { count: 0, gross: 0 };
    v.count++;
    v.gross += b.priceGross - b.refundAmount;
    byMethod.set(k, v);
  }
  for (const s of sales) {
    const k = `Sklep: ${s.method === "CASH" ? "Gotówka" : s.method === "CARD" ? "Karta" : s.method}`;
    const v = byMethod.get(k) ?? { count: 0, gross: 0 };
    v.count++;
    v.gross += s.amount;
    byMethod.set(k, v);
  }

  // Obłożenie: zajęte minuty / minuty otwarcia w okresie.
  let openMin = 0;
  for (let d = r.from; d <= r.to; d = addDays(d, 1)) {
    const h = HOURS[dowOf(d)];
    if (h) openMin += (warsaw(d, h.close).getTime() - warsaw(d, h.open).getTime()) / MIN;
  }
  const occupancy = SIMULATORS.filter((s) => s.status !== "COMING_SOON").map((s) => {
    const used = paid.filter((b) => b.simulatorId === s.id && !["REFUNDED", "CANCELLED"].includes(b.status)).reduce((x, b) => x + b.durationMin, 0);
    const sessions = paid.filter((b) => b.simulatorId === s.id && !["REFUNDED", "CANCELLED"].includes(b.status)).length;
    const revenue = paid.filter((b) => b.simulatorId === s.id).reduce((x, b) => x + b.priceGross - b.refundAmount, 0);
    return { sim: s.name, sessions, minutes: used, pct: openMin ? used / openMin : 0, revenue };
  });

  const cancellations = bookings.filter((b) => ["CANCELLED", "REFUNDED"].includes(b.status));
  const discounts = paid.filter((b) => b.discountCode);

  // Nowi vs powracający: czy klient (e-mail) miał wcześniejszą opłaconą rezerwację.
  const emails = Array.from(new Set(paid.map((b) => b.email)));
  const earlier = emails.length
    ? await prisma.booking.findMany({ where: { email: { in: emails }, paidAt: { not: null }, start: { lt: start } }, select: { email: true }, distinct: ["email"] })
    : [];
  const returning = new Set(earlier.map((e) => e.email));
  const customers = emails.map((e) => ({ email: e, type: returning.has(e) ? "Powracający" : "Nowy", visits: paid.filter((b) => b.email === e).length }));

  return { r, bookings, paid, sales, revenueGross, salesGross, totalGross, net, vat, byMethod, occupancy, openMin, cancellations, discounts, customers };
}

export async function buildWorkbook(r: Range, title: string) {
  const d = await reportData(r);
  const wb = new ExcelJS.Workbook();
  wb.creator = "Tirenders";
  wb.created = new Date();

  const head = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
    ws.views = [{ state: "frozen", ySplit: 1 }];
  };
  const money = "#,##0.00 \"zł\"";

  // Podsumowanie
  const sum = wb.addWorksheet("Podsumowanie");
  sum.columns = [{ header: "Pozycja", key: "k", width: 38 }, { header: "Wartość", key: "v", width: 22 }];
  head(sum);
  const active = d.paid.filter((b) => !["REFUNDED", "CANCELLED"].includes(b.status));
  const newC = d.customers.filter((c) => c.type === "Nowy").length;
  [
    ["Raport", title],
    ["Okres", r.from === r.to ? r.from : `${r.from} – ${r.to}`],
    ["Rezerwacje opłacone", active.length],
    ["Minuty jazdy", active.reduce((s, b) => s + b.durationMin, 0)],
    ["Przychód z rezerwacji (brutto, po zwrotach)", zl(d.revenueGross)],
    ["Sprzedaż stacjonarna (merch, kierownice)", zl(d.salesGross)],
    ["Przychód razem brutto", zl(d.totalGross)],
    [`Netto (VAT ${SITE.vatRate}%)`, zl(d.net)],
    ["VAT", zl(d.vat)],
    ["Zwroty", zl(d.paid.reduce((s, b) => s + b.refundAmount, 0))],
    ["Rabaty udzielone", zl(d.discounts.reduce((s, b) => s + b.discountAmount, 0))],
    ["Obłożenie średnie", d.occupancy.length ? d.occupancy.reduce((s, o) => s + o.pct, 0) / d.occupancy.length : 0],
    ["Klienci nowi", newC],
    ["Klienci powracający", d.customers.length - newC],
  ].forEach(([k, v]) => sum.addRow({ k, v }));
  [5, 6, 7, 8, 9, 10, 11].forEach((i) => (sum.getCell(`B${i + 1}`).numFmt = money));
  sum.getCell("B13").numFmt = "0.0%";

  // Rezerwacje
  const res = wb.addWorksheet("Rezerwacje");
  res.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Godzina", key: "time", width: 9 },
    { header: "Stanowisko", key: "sim", width: 18 },
    { header: "Czas (min)", key: "dur", width: 10 },
    { header: "Klient", key: "name", width: 22 },
    { header: "E-mail", key: "email", width: 28 },
    { header: "Telefon", key: "phone", width: 15 },
    { header: "Status", key: "status", width: 18 },
    { header: "Cena katalogowa", key: "list", width: 14 },
    { header: "Rabat", key: "disc", width: 10 },
    { header: "Kod rabatowy", key: "code", width: 14 },
    { header: "Zapłacono brutto", key: "gross", width: 15 },
    { header: "Netto", key: "net", width: 12 },
    { header: "VAT", key: "vat", width: 10 },
    { header: "Metoda", key: "method", width: 12 },
    { header: "Zwrot", key: "refund", width: 10 },
    { header: "Check-in", key: "checkin", width: 9 },
    { header: "Źródło", key: "source", width: 9 },
    { header: "Kod rezerwacji", key: "bcode", width: 14 },
  ];
  head(res);
  for (const b of d.bookings) {
    const gross = b.paidAt ? b.priceGross - b.refundAmount : 0;
    const t = netOf(gross, SITE.vatRate);
    res.addRow({
      date: fmtDate(b.start, "pl", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: fmtTime(b.start),
      sim: simById(b.simulatorId)?.name ?? b.simulatorId,
      dur: b.durationMin,
      name: b.name,
      email: b.email,
      phone: b.phone,
      status: STATUS_LABEL[b.status] ?? b.status,
      list: zl(b.listPriceGross),
      disc: zl(b.discountAmount),
      code: b.discountCode ?? "",
      gross: zl(gross),
      net: zl(t.net),
      vat: zl(t.vat),
      method: PAY_LABEL[b.paymentMethod ?? ""] ?? b.paymentMethod ?? "",
      refund: zl(b.refundAmount),
      checkin: b.checkedInAt ? fmtTime(b.checkedInAt) : "",
      source: b.source === "ADMIN" ? "Obsługa" : "Online",
      bcode: b.code,
    });
  }
  ["I", "J", "L", "M", "N", "P"].forEach((c) => (res.getColumn(c).numFmt = money));
  res.autoFilter = { from: "A1", to: "S1" };

  // Metody płatności
  const pm = wb.addWorksheet("Metody płatności");
  pm.columns = [{ header: "Metoda", key: "m", width: 24 }, { header: "Transakcje", key: "c", width: 12 }, { header: "Brutto", key: "g", width: 16 }];
  head(pm);
  d.byMethod.forEach((v, m) => pm.addRow({ m, c: v.count, g: zl(v.gross) }));
  pm.getColumn("g").numFmt = money;

  // Obłożenie
  const oc = wb.addWorksheet("Obłożenie");
  oc.columns = [
    { header: "Stanowisko", key: "sim", width: 20 },
    { header: "Sesje", key: "sessions", width: 8 },
    { header: "Minuty", key: "minutes", width: 10 },
    { header: `Minuty otwarcia`, key: "open", width: 14 },
    { header: "Obłożenie", key: "pct", width: 11 },
    { header: "Przychód brutto", key: "revenue", width: 16 },
  ];
  head(oc);
  d.occupancy.forEach((o) => oc.addRow({ ...o, open: d.openMin, revenue: zl(o.revenue) }));
  oc.getColumn("pct").numFmt = "0.0%";
  oc.getColumn("revenue").numFmt = money;

  // Osobny arkusz dla każdego stanowiska: kto, kiedy, ile zapłacił, czy przyszedł.
  for (const sim of SIMULATORS.filter((x) => x.status !== "COMING_SOON")) {
    const ws = wb.addWorksheet(sim.name.replace(/[\\/?*[\]:]/g, " ").slice(0, 31));
    ws.columns = [
      { header: "Data", key: "date", width: 12 },
      { header: "Od", key: "from", width: 8 },
      { header: "Do", key: "to", width: 8 },
      { header: "Czas (min)", key: "dur", width: 10 },
      { header: "Klient", key: "name", width: 24 },
      { header: "Telefon", key: "phone", width: 15 },
      { header: "Kod", key: "code", width: 10 },
      { header: "Status", key: "status", width: 18 },
      { header: "Przyszedł o", key: "checkin", width: 11 },
      { header: "Zapłacono brutto", key: "gross", width: 15 },
    ];
    head(ws);
    const list = d.bookings.filter((b) => b.simulatorId === sim.id);
    for (const b of list) {
      ws.addRow({
        date: fmtDate(b.start, "pl", { year: "numeric", month: "2-digit", day: "2-digit" }),
        from: fmtTime(b.start),
        to: fmtTime(b.end),
        dur: b.durationMin,
        name: b.name,
        phone: b.phone,
        code: b.code,
        status: STATUS_LABEL[b.status] ?? b.status,
        checkin: b.checkedInAt ? fmtTime(b.checkedInAt) : "",
        gross: zl(b.paidAt ? b.priceGross - b.refundAmount : 0),
      });
    }
    const o = d.occupancy.find((x) => x.sim === sim.name);
    ws.addRow({});
    const total = ws.addRow({ date: "Razem", dur: o?.minutes ?? 0, name: `${o?.sessions ?? 0} jazd, obłożenie ${((o?.pct ?? 0) * 100).toFixed(1)}%`, gross: zl(o?.revenue ?? 0) });
    total.font = { bold: true };
    ws.getColumn("gross").numFmt = money;
    if (list.length) ws.autoFilter = { from: "A1", to: "J1" };
  }

  // Zwroty i odwołania
  const cx = wb.addWorksheet("Zwroty i odwołania");
  cx.columns = [
    { header: "Kod", key: "code", width: 12 },
    { header: "Termin", key: "when", width: 20 },
    { header: "Klient", key: "name", width: 22 },
    { header: "Status", key: "status", width: 14 },
    { header: "Odwołano", key: "at", width: 20 },
    { header: "Zapłacono", key: "paid", width: 12 },
    { header: "Zwrot", key: "refund", width: 12 },
  ];
  head(cx);
  d.cancellations.forEach((b) =>
    cx.addRow({
      code: b.code,
      when: `${fmtDate(b.start, "pl")} ${fmtTime(b.start)}`,
      name: b.name,
      status: STATUS_LABEL[b.status],
      at: b.cancelledAt ? `${fmtDate(b.cancelledAt, "pl")} ${fmtTime(b.cancelledAt)}` : "",
      paid: b.paidAt ? zl(b.priceGross) : 0,
      refund: zl(b.refundAmount),
    }),
  );
  ["paid", "refund"].forEach((c) => (cx.getColumn(c).numFmt = money));

  // Vouchery i rabaty
  const dc = wb.addWorksheet("Vouchery i rabaty");
  dc.columns = [{ header: "Kod", key: "code", width: 16 }, { header: "Użycia", key: "n", width: 10 }, { header: "Rabat łącznie", key: "sum", width: 16 }];
  head(dc);
  const byCode = new Map<string, { n: number; sum: number }>();
  d.discounts.forEach((b) => {
    const v = byCode.get(b.discountCode!) ?? { n: 0, sum: 0 };
    v.n++;
    v.sum += b.discountAmount;
    byCode.set(b.discountCode!, v);
  });
  byCode.forEach((v, code) => dc.addRow({ code, n: v.n, sum: zl(v.sum) }));
  dc.getColumn("sum").numFmt = money;

  // Sklep
  const sh = wb.addWorksheet("Sprzedaż merch i kierownice");
  sh.columns = [
    { header: "Data", key: "date", width: 12 },
    { header: "Godzina", key: "time", width: 9 },
    { header: "Produkt", key: "product", width: 34 },
    { header: "Kategoria", key: "cat", width: 12 },
    { header: "Ilość", key: "qty", width: 8 },
    { header: "Brutto", key: "amount", width: 12 },
    { header: "Metoda", key: "method", width: 10 },
  ];
  head(sh);
  d.sales.forEach((s) =>
    sh.addRow({
      date: fmtDate(s.createdAt, "pl", { year: "numeric", month: "2-digit", day: "2-digit" }),
      time: fmtTime(s.createdAt),
      product: s.product,
      cat: s.category === "MERCH" ? "Merch" : s.category === "WHEEL" ? "Kierownica" : "Inne",
      qty: s.qty,
      amount: zl(s.amount),
      method: s.method === "CASH" ? "Gotówka" : s.method === "CARD" ? "Karta" : s.method,
    }),
  );
  sh.getColumn("amount").numFmt = money;

  // Klienci
  const cl = wb.addWorksheet("Klienci");
  cl.columns = [{ header: "E-mail", key: "email", width: 30 }, { header: "Typ", key: "type", width: 14 }, { header: "Wizyty w okresie", key: "visits", width: 16 }];
  head(cl);
  d.customers.forEach((c) => cl.addRow(c));

  const buf = Buffer.from(await wb.xlsx.writeBuffer());
  return { buffer: buf, data: d };
}

export function yesterdayWarsaw() {
  return addDays(zoned(new Date()).dateStr, -1);
}
