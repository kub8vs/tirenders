import { notFound, redirect } from "next/navigation";
import CustomerActions from "@/components/panel/CustomerActions";
import { simById } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { fmtDate, fmtTime } from "@/lib/time";

export const dynamic = "force-dynamic";
const STATUS: Record<string, string> = { PAID: "Opłacona", COMPLETED: "Była", NO_SHOW: "Nie przyszedł", PENDING: "Płaci", CANCELLED: "Odwołana", REFUNDED: "Zwrot", EXPIRED: "Wygasła" };

export default async function Page({ params }: { params: { id: string } }) {
  if (!(await staffUser("customers"))) redirect("/panel");
  const c = await prisma.customer.findUnique({ where: { id: params.id }, include: { bookings: { orderBy: { start: "desc" } } } });
  if (!c) notFound();
  const live = c.bookings.filter((b) => ["PAID", "COMPLETED", "NO_SHOW"].includes(b.status));
  const spent = live.reduce((s, b) => s + b.priceGross - b.refundAmount, 0);
  const fav = new Map<string, number>();
  for (const b of live) fav.set(b.simulatorId, (fav.get(b.simulatorId) ?? 0) + 1);
  const favSim = [...fav.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return (
    <>
      <p style={{ marginBottom: 10 }}><a href="/panel/klienci" className="muted" style={{ textDecoration: "underline" }}>← Klienci</a></p>
      <h1>{c.firstName} {c.lastName}</h1>
      <div className="kpis" style={{ marginBottom: 20 }}>
        <div className="kpi glass"><span>Wizyty</span><b>{live.length}</b></div>
        <div className="kpi glass"><span>Wydał</span><b>{pln(spent)}</b></div>
        <div className="kpi glass"><span>Ulubiony symulator</span><b style={{ fontSize: 22 }}>{favSim ? simById(favSim)?.name : "—"}</b></div>
        <div className="kpi glass"><span>Gość od</span><b style={{ fontSize: 22 }}>{fmtDate(c.createdAt, "pl", { day: "numeric", month: "long", year: "numeric" })}</b></div>
      </div>
      <div className="grid-2">
        <div className="glass panel-box" style={{ display: "grid", gap: 6, fontSize: 15 }}>
          <span><span className="muted">Telefon:</span> <a href={`tel:${c.phone.replace(/\s/g, "")}`} style={{ textDecoration: "underline" }}>{c.phone}</a></span>
          <span style={{ wordBreak: "break-all" }}><span className="muted">E-mail:</span> <a href={`mailto:${c.email}`} style={{ textDecoration: "underline" }}>{c.email}</a></span>
          <span><span className="muted">Język:</span> {c.locale === "en" ? "angielski" : "polski"}</span>
        </div>
        <CustomerActions id={c.id} note={c.note ?? ""} />
      </div>
      <h2>Historia wizyt</h2>
      <div className="tbl">
        <table>
          <thead><tr><th>Termin</th><th>Symulator</th><th>Czas</th><th>Kod</th><th>Status</th><th className="num">Kwota</th></tr></thead>
          <tbody>
            {c.bookings.map((b) => (
              <tr key={b.id}>
                <td>{fmtDate(b.start, "pl", { day: "numeric", month: "numeric", year: "2-digit" })} {fmtTime(b.start)}</td>
                <td>{simById(b.simulatorId)?.name}</td>
                <td>{b.durationMin} min</td>
                <td style={{ letterSpacing: ".1em" }}>{b.code}</td>
                <td><span className={`pill ${b.status}`}>{STATUS[b.status] ?? b.status}</span></td>
                <td className="num">{pln(b.priceGross - b.refundAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
