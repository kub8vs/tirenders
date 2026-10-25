import { redirect } from "next/navigation";
import ReceptionBoard from "@/components/panel/ReceptionBoard";
import { SIMULATORS } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { dayDesk } from "@/lib/reception";
import { addDays, fmtDate, todayWarsaw, warsaw } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { d?: string } }) {
  if (!(await staffUser("reception"))) redirect("/panel");
  const today = todayWarsaw();
  const date = searchParams.d && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d) ? searchParams.d : today;
  const rows = await dayDesk(date);
  const sims = SIMULATORS.filter((s) => s.status === "ACTIVE" || rows.some((b) => b.simulatorId === s.id)).map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <div className="head">
        <h1>Recepcja</h1>
        <div className="row no-print">
          <a className="btn-ghost" href={`/panel/recepcja?d=${addDays(date, -1)}`} aria-label="Poprzedni dzień">←</a>
          <span style={{ minWidth: 150, textAlign: "center" }}>{fmtDate(warsaw(date, "12:00"), "pl", { weekday: "long", day: "numeric", month: "long" })}</span>
          <a className="btn-ghost" href={`/panel/recepcja?d=${addDays(date, 1)}`} aria-label="Następny dzień">→</a>
          {date !== today && <a className="btn-ghost" href="/panel/recepcja">Dziś</a>}
          <a className="btn-ghost" href={`/panel/wydruk?d=${date}`}>Drukuj dzień</a>
        </div>
      </div>
      <ReceptionBoard rows={rows} sims={sims} today={date === today} date={date} />
    </>
  );
}
