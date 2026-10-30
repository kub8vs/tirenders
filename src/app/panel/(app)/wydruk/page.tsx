import { redirect } from "next/navigation";
import PrintButton from "@/components/panel/PrintButton";
import { SIMULATORS } from "@/config/site";
import { staffUser } from "@/lib/auth";
import { dayDesk } from "@/lib/reception";
import { addDays, fmtDate, todayWarsaw, warsaw } from "@/lib/time";

export const dynamic = "force-dynamic";

// Lista dnia na papier: jedna kartka A4 na każde stanowisko (plan awaryjny bez internetu).
export default async function Page({ searchParams }: { searchParams: { d?: string } }) {
  if (!(await staffUser("reception"))) redirect("/panel");
  const date = searchParams.d && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.d) ? searchParams.d : todayWarsaw();
  const rows = (await dayDesk(date)).filter((b) => b.status !== "PENDING");
  const day = fmtDate(warsaw(date, "12:00"), "pl", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const sims = SIMULATORS.filter((s) => s.status === "ACTIVE" || rows.some((b) => b.simulatorId === s.id));
  return (
    <div className="print-day">
      <div className="head no-print">
        <h1>Wydruk dnia</h1>
        <div className="row">
          <a className="btn-ghost" href={`/panel/wydruk?d=${addDays(date, -1)}`} aria-label="Poprzedni dzień">←</a>
          <span>{day}</span>
          <a className="btn-ghost" href={`/panel/wydruk?d=${addDays(date, 1)}`} aria-label="Następny dzień">→</a>
          <PrintButton />
        </div>
      </div>
      <p className="muted no-print" style={{ marginBottom: 20 }}>Każde stanowisko drukuje się na osobnej kartce. Recepcja odhacza przyjście w kratce.</p>
      {sims.map((s) => {
        const list = rows.filter((b) => b.simulatorId === s.id);
        return (
          <section key={s.id} className="sheet">
            <header>
              <div>
                <h2>{s.name}</h2>
                <p>{day}</p>
              </div>
              <img src="/img/2real-logo-sm.webp" alt="" width={520} height={180} />
            </header>
            <table>
              <thead><tr><th>Godzina</th><th>Imię i nazwisko</th><th>Kod</th><th>Czas</th><th>Telefon</th><th>Przyszedł</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6}>Brak rezerwacji</td></tr>}
                {list.map((b) => (
                  <tr key={b.id}>
                    <td>{b.from}–{b.to}</td>
                    <td>{b.name}{b.groupId ? " (grupa)" : ""}</td>
                    <td className="code">{b.code}</td>
                    <td>{b.durationMin} min</td>
                    <td>{b.phone}</td>
                    <td><span className="box">{b.checkedInAt ? "✓" : ""}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <footer>Rezerwacji: {list.length} · Wydrukowano {new Date().toLocaleString("pl-PL", { timeZone: "Europe/Warsaw" })}</footer>
          </section>
        );
      })}
      <style>{`
        .print-day .sheet { border: 1px solid var(--line); border-radius: 14px; padding: 20px; margin-bottom: 16px; overflow-x: auto; }
        .print-day .sheet header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; }
        .print-day .sheet header img { width: 110px; height: auto; }
        .print-day .sheet h2 { margin: 0; }
        .print-day .sheet header p { color: var(--muted); font-size: 14px; }
        .print-day table { min-width: 560px; }
        .print-day .code { letter-spacing: .14em; font-weight: 600; }
        .print-day .box { display: inline-block; width: 22px; height: 22px; border: 1.5px solid currentColor; border-radius: 4px; text-align: center; line-height: 20px; }
        .print-day footer { margin-top: 12px; font-size: 12px; color: var(--muted); }
        @media print {
          @page { size: A4; margin: 14mm; }
          html, body { background: #fff !important; color: #000 !important; }
          .bg-fx { display: none !important; }
          .print-day .sheet { border: 0; padding: 0; margin: 0; break-after: page; page-break-after: always; color: #000; }
          .print-day .sheet:last-child { break-after: auto; }
          .print-day .sheet header img { filter: invert(1) hue-rotate(180deg); }
          .print-day table { min-width: 0; font-size: 12pt; }
          .print-day th, .print-day td { border-bottom: 1px solid #999 !important; color: #000 !important; padding: 9px 6px; }
          .print-day .sheet header p, .print-day footer { color: #333 !important; }
        }
      `}</style>
    </div>
  );
}
