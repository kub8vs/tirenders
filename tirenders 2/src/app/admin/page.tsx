import { redirect } from "next/navigation";
import DayCalendar from "@/components/admin/DayCalendar";
import PhoneBooking from "@/components/admin/PhoneBooking";
import { HOURS, SIMULATORS } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { addDays, dowOf, fmtTime, todayWarsaw, warsaw } from "@/lib/time";

export default async function Page({ searchParams }: { searchParams: { d?: string } }) {
  const u = await staffUser("calendar");
  if (!u) redirect("/admin/raporty");
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
        <form style={{ display: "flex", gap: 8 }}>
          <a className="btn-ghost" href={`/admin?d=${addDays(date, -1)}`}>←</a>
          <input className="input" type="date" name="d" defaultValue={date} style={{ height: 46, width: 170 }} />
          <button className="btn-ghost" type="submit">Pokaż</button>
          <a className="btn-ghost" href={`/admin?d=${addDays(date, 1)}`}>→</a>
        </form>
      </div>
      <div className="stats" style={{ marginTop: 0, marginBottom: 26 }}>
        <div className="stat glass" style={{ gap: 10 }}><b style={{ fontSize: 44 }}>{active.length}</b><span>rezerwacji</span></div>
        <div className="stat glass" style={{ gap: 10 }}><b style={{ fontSize: 44 }}>{active.reduce((s, b) => s + b.durationMin, 0)}</b><span>minut jazdy</span></div>
        <div className="stat glass" style={{ gap: 10 }}><b style={{ fontSize: 44 }}>{pln(revenue)}</b><span>przychodu brutto</span></div>
      </div>
      {h ? (
        <DayCalendar
          open={warsaw(date, h.open).toISOString()}
          close={warsaw(date, h.close).toISOString()}
          sims={SIMULATORS.map((s) => ({ id: s.id, name: s.name, active: s.status === "ACTIVE" }))}
          bookings={bookings.map((b) => ({ id: b.id, code: b.code, simulatorId: b.simulatorId, start: b.start.toISOString(), end: b.end.toISOString(), name: b.name, phone: b.phone, email: b.email, status: b.status, price: b.priceGross, checkedIn: !!b.checkedInAt, source: b.source, time: fmtTime(b.start), note: b.note ?? "" }))}
        />
      ) : (
        <p className="notice">Tego dnia salon jest zamknięty (wg godzin otwarcia w konfiguracji).</p>
      )}
      <h2 style={{ fontSize: 24, margin: "50px 0 16px" }}>Rezerwacja telefoniczna / wyłączność</h2>
      <PhoneBooking date={date} sims={SIMULATORS.filter((s) => s.status === "ACTIVE").map((s) => ({ id: s.id, name: s.name }))} />
    </>
  );
}
