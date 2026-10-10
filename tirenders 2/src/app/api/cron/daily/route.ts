import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { sendEmail } from "@/lib/notify";
import { pln } from "@/lib/pricing";
import { buildWorkbook, dayRange, monthRange, yesterdayWarsaw } from "@/lib/report";
import { reportEmail } from "@/lib/templates";
import { zoned } from "@/lib/time";

export const dynamic = "force-dynamic";

// Codziennie rano: raport za wczoraj. 1. dnia miesiąca dodatkowo raport za poprzedni miesiąc.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const to = (process.env.REPORT_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) return NextResponse.json({ skipped: "REPORT_EMAILS not set" });

  const y = yesterdayWarsaw();
  const day = await buildWorkbook(dayRange(y), `Raport dzienny ${y}`);
  const summary = (d: typeof day.data) =>
    `<p>Rezerwacje: <b style="color:#fff">${d.paid.filter((b) => !["REFUNDED", "CANCELLED"].includes(b.status)).length}</b><br>Przychód brutto: <b style="color:#fff">${pln(d.totalGross)}</b><br>Netto: ${pln(d.net)} · VAT: ${pln(d.vat)}</p><p>Szczegóły w załączniku Excel.</p>`;
  for (const addr of to)
    await sendEmail({ to: addr, subject: `Raport dzienny ${y}`, html: reportEmail(`Raport ${y}`, summary(day.data)), attachments: [{ filename: `tirenders-raport-${y}.xlsx`, content: day.buffer }] });

  const today = zoned(new Date());
  let monthly = false;
  if (today.d === 1) {
    const pm = today.m === 1 ? 12 : today.m - 1;
    const py = today.m === 1 ? today.y - 1 : today.y;
    const label = `${py}-${String(pm).padStart(2, "0")}`;
    const month = await buildWorkbook(monthRange(py, pm), `Raport miesięczny ${label}`);
    for (const addr of to)
      await sendEmail({ to: addr, subject: `Raport miesięczny ${label}`, html: reportEmail(`Raport ${label}`, summary(month.data)), attachments: [{ filename: `tirenders-raport-${label}.xlsx`, content: month.buffer }] });
    monthly = true;
  }
  return NextResponse.json({ day: y, monthly });
}
