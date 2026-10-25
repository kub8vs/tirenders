import { redirect } from "next/navigation";
import { Heat } from "@/components/panel/Charts";
import PeriodTabs, { periodOf } from "@/components/panel/PeriodTabs";
import SimService from "@/components/panel/SimService";
import { PRICES } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { pln } from "@/lib/pricing";
import { liveSims, serviceBoard } from "@/lib/sims";
import { heatmap, lastDays, openMinutes, pct, periodStats } from "@/lib/stats";
import { zoned } from "@/lib/time";

export const dynamic = "force-dynamic";

const TYPE: Record<string, string> = { STANDARD: "Karoseria auta", GT3: "Kokpit wyścigowy GT3", MOTION5: "Platforma ruchu 5DOF", MOTION6: "Platforma ruchu 6DOF" };
const STATUS: Record<string, string> = { ACTIVE: "Działa", COMING_SOON: "W budowie", OUT_OF_SERVICE: "Serwis" };

export default async function Page({ searchParams }: { searchParams: { p?: string } }) {
  if (!(await staffUser("sims"))) redirect("/panel");
  const days = periodOf(searchParams.p);
  const r = lastDays(days);
  const [s, sims, service] = await Promise.all([periodStats(r), liveSims(), serviceBoard()]);
  const open = openMinutes(r);
  return (
    <>
      <div className="head">
        <h1>Symulatory</h1>
        <PeriodTabs base="/panel/symulatory" current={days} />
      </div>
      <h2 style={{ marginTop: 0 }}>Serwis</h2>
      <SimService rows={service} />
      <h2>Statystyki stanowisk</h2>
      <div className="cards">
        {sims.map((sim) => {
          const list = s.live.filter((b) => b.simulatorId === sim.id);
          const minutes = list.reduce((x, b) => x + b.durationMin, 0);
          const revenue = s.paid.filter((b) => b.simulatorId === sim.id).reduce((x, b) => x + b.priceGross - b.refundAmount, 0);
          const hours = new Map<number, number>();
          for (const b of list) hours.set(zoned(b.start).hh, (hours.get(zoned(b.start).hh) ?? 0) + 1);
          const top = [...hours.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([h]) => `${h}:00`);
          const durations = new Map<number, number>();
          for (const b of list) durations.set(b.durationMin, (durations.get(b.durationMin) ?? 0) + 1);
          const favDur = [...durations.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
          return (
            <article key={sim.id} className="card glass">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <h3 style={{ margin: 0 }}>{sim.name}</h3>
                <span className={`pill ${sim.status === "ACTIVE" ? "PAID" : "PENDING"}`}>{STATUS[sim.status]}</span>
              </div>
              <p>{sim.body.pl}</p>
              <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 14px", fontSize: 13.5 }}>
                <dt className="muted">Typ</dt><dd>{TYPE[sim.priceGroup]}{sim.dof ? ` · ${sim.dof} stopni swobody` : ""}</dd>
                <dt className="muted">Cena</dt><dd>od {pln(Math.min(...Object.values(PRICES[sim.priceGroup]) as number[]) * 100)}</dd>
              </dl>
              <div className="kpis" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                <div className="kpi" style={{ padding: 0 }}><span>Przychód</span><b style={{ fontSize: 22 }}>{pln(revenue)}</b></div>
                <div className="kpi" style={{ padding: 0 }}><span>Jazdy</span><b style={{ fontSize: 22 }}>{list.length}</b></div>
                <div className="kpi" style={{ padding: 0 }}><span>Obłożenie</span><b style={{ fontSize: 22 }}>{pct(open ? minutes / open : 0)}</b></div>
                <div className="kpi" style={{ padding: 0 }}><span>Minuty jazdy</span><b style={{ fontSize: 22 }}>{minutes}</b></div>
              </div>
              <p style={{ fontSize: 13 }}>
                Najczęstszy czas jazdy: {favDur ? `${favDur} min` : "—"}<br />
                Najpopularniejsze godziny: {top.length ? top.join(", ") : "—"}<br />
                Nie przyszło: {list.filter((b) => b.status === "NO_SHOW").length}
              </p>
            </article>
          );
        })}
      </div>
      <h2>Kiedy ludzie jeżdżą (wszystkie stanowiska)</h2>
      <div className="glass panel-box"><Heat {...heatmap(s.live)} /></div>
      <p className="muted" style={{ marginTop: 14, fontSize: 13 }}>Pełne opisy sprzętu (kierownica, pedały, fotel) dopiszemy, gdy dostaniemy je od salonu.</p>
    </>
  );
}
