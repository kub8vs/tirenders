import { NextResponse } from "next/server";
import { cronAuthorized } from "@/lib/cron";
import { prisma } from "@/lib/db";
import { deskMail } from "@/lib/reception";
import { sendEmail } from "@/lib/notify";
import { pln } from "@/lib/pricing";
import { buildWorkbook, dayRange, monthRange, yesterdayWarsaw } from "@/lib/report";
import { reportEmail } from "@/lib/templates";
import { todayWarsaw, zoned } from "@/lib/time";

export const dynamic = "force-dynamic";

// Codziennie rano: lista dnia dla recepcji (plan awaryjny na papier), raport za wczoraj dla właścicieli,
// a 1. dnia miesiąca dodatkowo raport za poprzedni miesiąc.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const date = todayWarsaw();
  const desk = (await prisma.user.findMany({ where: { role: "STAFF" }, select: { email: true } })).map((u) => u.email);
  if (desk.length) {
    const list = await deskMail(date);
    for (const addr of desk)
      await sendEmail({
        to: addr,
        subject: `Lista gości na dziś ${date} (${list.count})`,
        html: reportEmail(`Dziś: ${list.count} rezerwacji`, `<p>Lista na wypadek braku internetu. Ten sam plik możesz wydrukować w panelu: Wydruk dnia.</p>${list.html}`),
        attachments: [{ filename: `lista-gosci-${date}.xlsx`, content: list.buffer }],
      });
  }

  const to = (process.env.REPORT_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (!to.length) return NextResponse.json({ desk: desk.length, skipped: "REPORT_EMAILS not set" });

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
  return NextResponse.json({ desk: desk.length, day: y, monthly });
}
