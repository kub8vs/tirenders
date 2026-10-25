"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const ROLES: Record<string, string> = { OWNER: "Właściciel", STAFF: "Recepcja", ACCOUNTING: "Księgowość", CUSTOMER: "Bez dostępu (usuń z zespołu)" };

type Member = { email: string; name: string | null; role: string; hasPassword: boolean };

export default function TeamAdmin({ team, me }: { team: Member[]; me: string }) {
  const router = useRouter();
  const [f, setF] = useState({ email: "", name: "", role: "STAFF" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const post = async (body: object, ok: string) => {
    const res = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? { ok: true, text: ok } : { ok: false, text: "Nie udało się (nie możesz odebrać sobie roli właściciela)." });
    if (res.ok) router.refresh();
    return res.ok;
  };
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await post({ email: f.email, name: f.name || undefined, role: f.role }, `Dodano. Zaproszenie z linkiem do hasła poszło na ${f.email}.`)) setF({ email: "", name: "", role: "STAFF" });
        }}
        className="glass"
        style={{ padding: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))", gap: 12, alignItems: "end" }}
      >
        <div className="field"><label htmlFor="t-e">E-mail</label><input id="t-e" className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /></div>
        <div className="field"><label htmlFor="t-n">Imię (opcjonalnie)</label><input id="t-n" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="field">
          <label htmlFor="t-r">Rola</label>
          <select id="t-r" className="input" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
            {Object.entries(ROLES).filter(([k]) => k !== "CUSTOMER").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <button className="btn-white" type="submit" disabled={!f.email}>Dodaj do zespołu</button>
      </form>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
      <div className="tbl">
        <table>
          <thead><tr><th>Osoba</th><th>Rola</th><th>Hasło</th><th /></tr></thead>
          <tbody>
            {team.map((u) => (
              <tr key={u.email}>
                <td style={{ wordBreak: "break-all" }}>{u.email}{u.name && <div className="muted" style={{ fontSize: 13 }}>{u.name}</div>}</td>
                <td>
                  <select className="input" style={{ height: 40, minWidth: 170 }} value={u.role} disabled={u.email === me} onChange={(e) => post({ email: u.email, role: e.target.value }, "Zapisano")} aria-label={`Rola ${u.email}`}>
                    {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td>{u.hasPassword ? <span className="pill PAID">ustawione</span> : <span className="pill PENDING">czeka na ustawienie</span>}</td>
                <td><button className="btn-ghost" type="button" style={{ height: 38, padding: "0 14px", fontSize: 13 }} onClick={() => post({ email: u.email, sendLink: true }, `Link do hasła poszedł na ${u.email}.`)}>Wyślij link do hasła</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
