import Link from "next/link";
import { redirect } from "next/navigation";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { fmtDate, warsaw } from "@/lib/time";
import { monthToDate } from "@/lib/stats";

export const dynamic = "force-dynamic";
const LIVE = ["PAID", "COMPLETED", "NO_SHOW"];

export default async function Page({ searchParams }: { searchParams: { q?: string; s?: string } }) {
  if (!(await staffUser("customers"))) redirect("/panel");
  const q = (searchParams.q ?? "").trim();
  const sort = searchParams.s === "visits" ? "visits" : searchParams.s === "new" ? "new" : "spent";
  const words = q.split(/\s+/).filter(Boolean);
  const customers = await prisma.customer.findMany({
    where: words.length
      ? { AND: words.map((w) => ({ OR: [{ firstName: { contains: w, mode: "insensitive" as const } }, { lastName: { contains: w, mode: "insensitive" as const } }, { email: { contains: w, mode: "insensitive" as const } }, { phone: { contains: w } }] })) }
      : {},
    include: { bookings: { where: { status: { in: LIVE } }, select: { priceGross: true, refundAmount: true, start: true, simulatorId: true } } },
    take: 500,
  });
  const rows = customers
    .map((c) => ({
      ...c,
      visits: c.bookings.length,
      spent: c.bookings.reduce((s, b) => s + b.priceGross - b.refundAmount, 0),
      last: c.bookings.reduce<Date | null>((m, b) => (!m || b.start > m ? b.start : m), null),
    }))
    .sort((a, b) => (sort === "visits" ? b.visits - a.visits : sort === "new" ? b.createdAt.getTime() - a.createdAt.getTime() : b.spent - a.spent));
  const total = await prisma.customer.count();
  const m = monthToDate();
  const newThisMonth = await prisma.customer.count({ where: { createdAt: { gte: warsaw(m.from, "00:00") } } });
  const withVisits = rows.filter((r) => r.visits > 0);
  const returning = withVisits.filter((r) => r.visits > 1).length;
  return (
    <>
      <h1>Klienci</h1>
      <div className="kpis" style={{ marginBottom: 20 }}>
        <div className="kpi glass"><span>Wszyscy goście</span><b>{total}</b></div>
        <div className="kpi glass"><span>Nowi w tym miesiącu</span><b>{newThisMonth}</b></div>
        <div className="kpi glass"><span>Wracają (2+ wizyty)</span><b>{withVisits.length ? Math.round((returning / withVisits.length) * 100) : 0}%</b><small>{returning} osób</small></div>
      </div>
      <form className="row" style={{ marginBottom: 16 }} action="/panel/klienci">
        <input className="input" name="q" defaultValue={q} placeholder="Imię, nazwisko, e-mail albo telefon" style={{ flex: "1 1 260px", height: 46 }} aria-label="Szukaj klienta" />
        <select className="input" name="s" defaultValue={sort} style={{ width: 200, height: 46 }} aria-label="Sortuj">
          <option value="spent">Najwięcej wydali</option>
          <option value="visits">Najwięcej wizyt</option>
          <option value="new">Najnowsi</option>
        </select>
        <button className="btn-white" type="submit" style={{ height: 46 }}>Szukaj</button>
      </form>
      <div className="tbl">
        <table>
          <thead><tr><th>Gość</th><th>Kontakt</th><th className="num">Wizyty</th><th className="num">Wydał</th><th>Ostatnio</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={5} className="muted">Brak gości{q ? " dla tego wyszukiwania" : ""}.</td></tr>}
            {rows.slice(0, 200).map((c) => (
              <tr key={c.id}>
                <td><Link href={`/panel/klienci/${c.id}`} style={{ textDecoration: "underline" }}>{c.firstName} {c.lastName}</Link></td>
                <td style={{ fontSize: 13 }}>{c.phone}<br /><span className="muted" style={{ wordBreak: "break-all" }}>{c.email}</span></td>
                <td className="num">{c.visits}</td>
                <td className="num">{pln(c.spent)}</td>
                <td>{c.last ? fmtDate(c.last, "pl", { day: "numeric", month: "numeric", year: "2-digit" }) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
