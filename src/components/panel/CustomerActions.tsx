"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CustomerActions({ id, note }: { id: string; note: string }) {
  const router = useRouter();
  const [n, setN] = useState(note);
  const [msg, setMsg] = useState<string | null>(null);
  const call = async (action: string, extra: object = {}) => {
    const r = await fetch("/api/admin/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, id, ...extra }) });
    return r;
  };
  return (
    <div className="glass panel-box" style={{ display: "grid", gap: 10 }}>
      <label htmlFor="c-note" className="muted" style={{ fontSize: 13 }}>Notatka (widzi ją zespół)</label>
      <textarea id="c-note" className="input" style={{ height: 90, padding: 12 }} value={n} onChange={(e) => setN(e.target.value)} maxLength={500} />
      <div className="row">
        <button className="btn-ghost" type="button" onClick={async () => setMsg((await call("note", { note: n })).ok ? "Zapisano" : "Błąd")}>Zapisz notatkę</button>
        <a className="btn-ghost" href={`/api/admin/customers?export=${id}`}>Pobierz dane (RODO)</a>
        <button className="btn-ghost" type="button" style={{ color: "#ff9a9a" }} onClick={async () => {
          if (!confirm("Usunąć dane osobowe tego gościa? Rezerwacje zostaną w raportach bez imienia, maila i telefonu. Tego nie da się cofnąć.")) return;
          const r = await call("forget");
          if (r.ok) router.push("/panel/klienci"); else setMsg("Nie można usunąć: gość ma nadchodzącą rezerwację.");
        }}>Usuń dane (RODO)</button>
      </div>
      {msg && <p className="ok">{msg}</p>}
    </div>
  );
}
