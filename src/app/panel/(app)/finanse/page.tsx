import { redirect } from "next/navigation";
import { Bars, HBars } from "@/components/panel/Charts";
import PeriodTabs, { periodOf } from "@/components/panel/PeriodTabs";
import { staffUser } from "@/lib/auth";
import { pln } from "@/lib/pricing";
import { dailySeries, lastDays, periodStats, previous, trend } from "@/lib/stats";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { p?: string } }) {
  if (!(await staffUser("finance"))) redirect("/panel");
  const days = periodOf(searchParams.p);
  const r = lastDays(days);
  const [s, prev, series] = await Promise.all([periodStats(r), periodStats(previous(r)), dailySeries(r)]);
  const codes = new Map<string, { n: number; off: number }>();
  for (const b of s.discounts) {
    const k = b.discountCode!;
    const v = codes.get(k) ?? { n: 0, off: 0 };
    v.n++;
    v.off += b.discountAmount;
    codes.set(k, v);
  }
  const discountTotal = s.paid.reduce((x, b) => x + b.discountAmount, 0);
  return (
    <>
      <div className="head">
        <h1>Finanse</h1>
        <PeriodTabs base="/panel/finanse" current={days} />
      </div>
      <div className="kpis">
        <div className="kpi glass"><span>Przychód brutto razem</span><b>{pln(s.totalGross)}</b><small className={trend(s.totalGross, prev.totalGross).cls}>{trend(s.totalGross, prev.totalGross).text}</small></div>
        <div className="kpi glass"><span>Netto / VAT 23%</span><b style={{ fontSize: 24 }}>{pln(s.net)}</b><small>VAT {pln(s.vat)}</small></div>
        <div className="kpi glass"><span>Rezerwacje</span><b>{pln(s.revenueGross)}</b><small>{s.count} jazd · śr. {pln(s.avg)}</small></div>
        <div className="kpi glass"><span>Sklep (merch, kierownice)</span><b>{pln(s.salesGross)}</b><small>{s.sales.length} sprzedaży</small></div>
        <div className="kpi glass"><span>Zwroty</span><b>{pln(s.refunds)}</b><small>{s.cancellations.length} odwołań</small></div>
        <div className="kpi glass"><span>Udzielone rabaty</span><b>{pln(discountTotal)}</b><small>kody i rabaty grupowe</small></div>
      </div>
      <h2>Przychód dzień po dniu</h2>
      <Bars title="Przychód brutto z rezerwacji" fmt={(x) => pln(x)} data={series.map((d) => ({ label: d.date.slice(8) + "." + d.date.slice(5, 7), value: d.gross }))} />
      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Metody płatności</b>
          <HBars fmt={(x) => pln(x)} rows={[...s.byMethod.entries()].map(([k, v]) => ({ label: k, value: v.gross, note: `· ${v.count}` }))} />
        </div>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Przychód wg symulatora</b>
          <HBars fmt={(x) => pln(x)} rows={s.occupancy.map((o) => ({ label: o.sim, value: o.revenue, note: `· ${o.sessions} jazd` }))} />
        </div>
      </div>
      <h2>Kody rabatowe</h2>
      <div className="tbl">
        <table>
          <thead><tr><th>Kod</th><th className="num">Użycia</th><th className="num">Rabat razem</th></tr></thead>
          <tbody>
            {codes.size === 0 && <tr><td colSpan={3} className="muted">Nikt nie użył kodu w tym okresie.</td></tr>}
            {[...codes.entries()].map(([k, v]) => <tr key={k}><td>{k}</td><td className="num">{v.n}</td><td className="num">{pln(v.off)}</td></tr>)}
          </tbody>
        </table>
      </div>
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>Pełne zestawienie do księgowości: <a href="/panel/raporty" style={{ textDecoration: "underline" }}>Raporty Excel</a>.</p>
    </>
  );
}
