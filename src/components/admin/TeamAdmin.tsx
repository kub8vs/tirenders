"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES: Record<string, string> = { OWNER: "Właściciel", STAFF: "Obsługa", ACCOUNTING: "Księgowość", CUSTOMER: "Klient (odbierz dostęp)" };

export default function TeamAdmin({ team }: { team: { email: string; name: string | null; role: string }[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("STAFF");
  const [msg, setMsg] = useState<string | null>(null);
  const save = async (e: string, r: string) => {
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, role: r }) });
    setMsg(res.ok ? "Zapisano" : "Nie można zmienić (np. własnej roli)");
    if (res.ok) router.refresh();
  };
  return (
    <div style={{ display: "grid", gap: 26 }}>
      <form onSubmit={(e) => { e.preventDefault(); save(email, role); }} className="glass" style={{ padding: 22, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end" }}>
        <div className="field" style={{ flex: "1 1 260px" }}><label htmlFor="t-e">E-mail</label><input id="t-e" className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="field">
          <label htmlFor="t-r">Rola</label>
          <select id="t-r" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLES).filter(([k]) => k !== "CUSTOMER").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="btn-white" type="submit" disabled={!email}>Nadaj</button>
      </form>
      {msg && <p className="ok">{msg}</p>}
      <table>
        <thead><tr><th>E-mail</th><th>Imię</th><th>Rola</th></tr></thead>
        <tbody>
          {team.map((u) => (
            <tr key={u.email}>
              <td>{u.email}</td>
              <td>{u.name ?? "—"}</td>
              <td>
                <select className="input" style={{ height: 38, width: 210 }} value={u.role} onChange={(e) => save(u.email, e.target.value)} aria-label={`Rola ${u.email}`}>
                  {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
