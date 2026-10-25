import { redirect } from "next/navigation";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { q?: string } }) {
  if (!(await staffUser("logs"))) redirect("/panel");
  const q = (searchParams.q ?? "").trim();
  const logs = await prisma.auditLog.findMany({
    where: q ? { OR: [{ actor: { contains: q, mode: "insensitive" } }, { action: { contains: q, mode: "insensitive" } }, { details: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return (
    <>
      <h1>Historia zmian</h1>
      <p className="muted" style={{ marginBottom: 16, maxWidth: "70ch" }}>Każde przyjęcie gościa, odwołanie, zwrot, przeniesienie, rezerwacja telefoniczna i zmiana w zespole: kto, co i kiedy. Ostatnie 300 wpisów.</p>
      <form className="row" style={{ marginBottom: 16 }} action="/panel/historia">
        <input className="input" name="q" defaultValue={q} placeholder="Szukaj: osoba, kod, nazwisko, akcja" style={{ flex: "1 1 260px", height: 46 }} aria-label="Szukaj w historii" />
        <button className="btn-white" type="submit" style={{ height: 46 }}>Szukaj</button>
      </form>
      <div className="tbl">
        <table>
          <thead><tr><th>Kiedy</th><th>Kto</th><th>Co</th><th>Szczegóły</th></tr></thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={4} className="muted">Brak wpisów.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.createdAt, "pl", { day: "numeric", month: "numeric" })} {fmtTime(l.createdAt)}</td>
                <td style={{ wordBreak: "break-all" }}>{l.actor}</td>
                <td>{l.action}</td>
                <td className="muted">{l.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
