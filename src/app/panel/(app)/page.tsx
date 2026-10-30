import Link from "next/link";
import { redirect } from "next/navigation";
import { Bars, HBars } from "@/components/panel/Charts";
import { simById } from "@/config/site";
import { canSee, currentUser, panelHome } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { dayDesk } from "@/lib/reception";
import { dailySeries, lastDays, monthToDate, pct, periodStats, previous, trend, weekRange } from "@/lib/stats";
import { addDays, fmtDate, fmtTime, todayWarsaw, warsaw } from "@/lib/time";
import { analyticsReady, sum, visits } from "@/lib/vercelAnalytics";

export const dynamic = "force-dynamic";

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/panel/logowanie");
  if (!canSee(u, "dashboard")) redirect(panelHome(u.role));
  const today = todayWarsaw();
  const day = { from: today, to: today };
  const week = weekRange(today);
  const month = monthToDate(today);
  const [d, dPrev, w, wPrev, m, mPrev, series, desk, latest, v7] = await Promise.all([
    periodStats(day),
    periodStats({ from: addDays(today, -7), to: addDays(today, -7) }),
    periodStats(week),
    periodStats(previous(week)),
    periodStats(month),
    periodStats(previous(month)),
    dailySeries(lastDays(30, today)),
    dayDesk(today),
    prisma.booking.findMany({ where: { paidAt: { not: null } }, orderBy: { paidAt: "desc" }, take: 8 }),
    visits(["day"], warsaw(addDays(today, -6), "00:00"), new Date()),
  ]);
  const t30 = await periodStats(lastDays(30, today));
  const arrived = desk.filter((b) => b.checkedInAt).length;
  const waiting = desk.filter((b) => b.status === "PAID" && !b.checkedInAt).length;
  const noShow = desk.filter((b) => b.status === "NO_SHOW").length;
  const kpi = (label: string, value: string, t?: { cls: string; text: string }) => (
    <div className="kpi glass"><span>{label}</span><b>{value}</b>{t && <small className={t.cls}>{t.text}</small>}</div>
  );
  return (
    <>
      <div className="head">
        <h1>Pulpit</h1>
        <span className="muted">{fmtDate(new Date(), "pl", { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>
      <div className="kpis">
        {kpi("Przychód dziś", pln(d.revenueGross), trend(d.revenueGross, dPrev.revenueGross))}
        {kpi("Ten tydzień", pln(w.revenueGross), trend(w.revenueGross, wPrev.revenueGross))}
        {kpi("Ten miesiąc", pln(m.revenueGross), trend(m.revenueGross, mPrev.revenueGross))}
        {kpi("Goście dziś", String(desk.length), { cls: "", text: `${arrived} przyszło · ${waiting} czeka · ${noShow} nie przyszło` })}
        {kpi("Obłożenie dziś", pct(d.occupancyAll), { cls: "", text: `${d.minutes} min jazdy` })}
        {kpi("Śr. wartość rezerwacji", pln(t30.avg), { cls: "", text: "ostatnie 30 dni" })}
        {analyticsReady() && kpi("Odwiedziny (7 dni)", String(sum(v7, "visitors")), { cls: "", text: `${sum(v7, "pageviews")} wyświetleń stron` })}
      </div>

      <h2>Przychód z ostatnich 30 dni</h2>
      <Bars title="Przychód brutto dziennie" fmt={(x) => pln(x)} data={series.map((s) => ({ label: s.date.slice(8) + "." + s.date.slice(5, 7), value: s.gross }))} />

      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Obłożenie symulatorów (30 dni)</b>
          <HBars fmt={(x) => `${Math.round(x * 100)}%`} rows={t30.occupancy.map((o) => ({ label: o.sim, value: o.pct, note: `· ${o.sessions} jazd` }))} />
          <p style={{ marginTop: 12 }}><Link href="/panel/symulatory" style={{ textDecoration: "underline" }}>Szczegóły symulatorów</Link></p>
        </div>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Ostatnie opłacone rezerwacje</b>
          {latest.length === 0 && <p className="muted">Jeszcze nie ma rezerwacji.</p>}
          {latest.map((b) => (
            <div key={b.id} className="row" style={{ justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--line)", fontSize: 14 }}>
              <span>{b.name}<br /><small className="muted">{simById(b.simulatorId)?.name} · {fmtDate(b.start, "pl", { day: "numeric", month: "numeric" })} {fmtTime(b.start)}</small></span>
              <b style={{ fontWeight: 500 }}>{pln(b.priceGross)}</b>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
