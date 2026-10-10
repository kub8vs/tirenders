import { redirect } from "next/navigation";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, fmtTime } from "@/lib/time";

export default async function Page() {
  if (!(await staffUser("logs"))) redirect("/admin");
  const logs = await prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 150 });
  return (
    <>
      <h1>Powiadomienia</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: "70ch" }}>Ostatnie 150 maili i SMS-ów. Status DEV = brak kluczy Resend/SMSAPI, wiadomość nie wyszła (tryb lokalny).</p>
      <div style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Kiedy</th><th>Kanał</th><th>Do</th><th>Treść</th><th>Status</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td style={{ whiteSpace: "nowrap" }}>{fmtDate(l.createdAt, "pl")} {fmtTime(l.createdAt)}</td>
                <td>{l.channel}</td>
                <td>{l.to}</td>
                <td style={{ maxWidth: 520 }}>{l.subject ? <b style={{ fontWeight: 500 }}>{l.subject}<br /></b> : null}<span style={{ color: "#aaa" }}>{l.body.slice(0, 220)}</span></td>
                <td><span className={`pill ${l.status === "SENT" ? "PAID" : l.status === "DEV" ? "PENDING" : "CANCELLED"}`}>{l.status}</span>{l.error && <small style={{ display: "block", color: "#ff9a9a" }}>{l.error.slice(0, 120)}</small>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
