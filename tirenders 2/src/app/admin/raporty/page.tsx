import { redirect } from "next/navigation";
import { staffUser } from "@/lib/auth";
import { pln } from "@/lib/pricing";
import { monthRange, reportData, yesterdayWarsaw } from "@/lib/report";
import { todayWarsaw, zoned } from "@/lib/time";

export default async function Page() {
  if (!(await staffUser("reports"))) redirect("/admin");
  const today = todayWarsaw();
  const z = zoned(new Date());
  const month = `${z.y}-${String(z.m).padStart(2, "0")}`;
  const m = await reportData(monthRange(z.y, z.m));
  return (
    <>
      <h1>Raporty Excel</h1>
      <div className="cards" style={{ marginBottom: 30 }}>
        <form className="card glass" action="/api/admin/report" method="get">
          <h3>Raport dzienny</h3>
          <input type="hidden" name="type" value="day" />
          <input className="input" type="date" name="date" defaultValue={yesterdayWarsaw()} max={today} aria-label="Dzień" />
          <button className="btn-white" type="submit">Pobierz .xlsx</button>
        </form>
        <form className="card glass" action="/api/admin/report" method="get">
          <h3>Raport miesięczny</h3>
          <input type="hidden" name="type" value="month" />
          <input className="input" type="month" name="month" defaultValue={month} aria-label="Miesiąc" />
          <button className="btn-white" type="submit">Pobierz .xlsx</button>
        </form>
      </div>
      <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 30 }}>
        Każdy raport ma arkusze: Podsumowanie, Rezerwacje, Metody płatności, Obłożenie, Zwroty i odwołania, Vouchery i rabaty, Sprzedaż merch i kierownice, Klienci (nowi / powracający). Raport dzienny za wczoraj i miesięczny 1. dnia miesiąca przychodzą też automatycznie mailem na adresy z REPORT_EMAILS.
      </p>
      <h2 style={{ fontSize: 22, marginBottom: 14 }}>Ten miesiąc ({month})</h2>
      <table>
        <tbody>
          <tr><th>Przychód brutto</th><td>{pln(m.totalGross)}</td></tr>
          <tr><th>Netto / VAT</th><td>{pln(m.net)} / {pln(m.vat)}</td></tr>
          <tr><th>Sprzedaż sklep</th><td>{pln(m.salesGross)}</td></tr>
          {m.occupancy.map((o) => (
            <tr key={o.sim}><th>Obłożenie · {o.sim}</th><td>{(o.pct * 100).toFixed(1)}% · {o.sessions} sesji</td></tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
