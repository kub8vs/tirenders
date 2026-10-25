import { redirect } from "next/navigation";
import DayCalendar from "@/components/panel/DayCalendar";
import { HOURS, SIMULATORS } from "@/config/site";
import { canSee, staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { addDays, dowOf, fmtTime, todayWarsaw, warsaw } from "@/lib/time";

export default async function Page({ searchParams }: { searchParams: { d?: string } }) {
  const u = await staffUser("calendar");
  if (!u) redirect("/panel");
  const owner = canSee(u, "finance");
  const date = searchParams.d && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d) ? searchParams.d : todayWarsaw();
  const from = warsaw(date, "00:00");
  const to = warsaw(addDays(date, 1), "06:00");
  const bookings = await prisma.booking.findMany({
    where: { start: { gte: from, lt: to }, status: { notIn: ["EXPIRED"] } },
    orderBy: { start: "asc" },
  });
  const h = HOURS[dowOf(date)];
  const active = bookings.filter((b) => ["PAID", "COMPLETED", "NO_SHOW"].includes(b.status));
  const revenue = active.reduce((s, b) => s + b.priceGross - b.refundAmount, 0);
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Kalendarz</h1>
        <form style={{ display: "flex", gap: 8, flexWrap: "wrap" }} action="/panel/kalendarz">
          <a className="btn-ghost" href={`/panel/kalendarz?d=${addDays(date, -1)}`}>←</a>
          <input className="input" type="date" name="d" defaultValue={date} style={{ height: 46, width: 170 }} />
          <button className="btn-ghost" type="submit">Pokaż</button>
          <a className="btn-ghost" href={`/panel/kalendarz?d=${addDays(date, 1)}`}>→</a>
        </form>
      </div>
      <div className="kpis" style={{ marginBottom: 22 }}>
        <div className="kpi glass"><span>Rezerwacje</span><b>{active.length}</b></div>
        <div className="kpi glass"><span>Minuty jazdy</span><b>{active.reduce((s, b) => s + b.durationMin, 0)}</b></div>
        {owner && <div className="kpi glass"><span>Przychód brutto</span><b>{pln(revenue)}</b></div>}
      </div>
      {h ? (
        <DayCalendar
          canRefund={owner}
          open={warsaw(date, h.open).toISOString()}
          close={warsaw(date, h.close).toISOString()}
          sims={SIMULATORS.map((s) => ({ id: s.id, name: s.name, active: s.status === "ACTIVE" }))}
          bookings={bookings.map((b) => ({ id: b.id, code: b.code, simulatorId: b.simulatorId, start: b.start.toISOString(), end: b.end.toISOString(), name: b.name, phone: b.phone, email: b.email, status: b.status, price: b.priceGross, checkedIn: !!b.checkedInAt, source: b.source, time: fmtTime(b.start), note: b.note ?? "" }))}
        />
      ) : (
        <p className="notice">Tego dnia salon jest zamknięty (wg godzin otwarcia w konfiguracji).</p>
      )}
      <p style={{ marginTop: 40 }}><a className="btn-ghost" href="/panel/telefon">+ Rezerwacja telefoniczna</a></p>
    </>
  );
}
