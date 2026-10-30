"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type C = { code: string; percent: number | null; amountOff: number | null; uses: number; maxUses: number | null; validTo: string | null; active: boolean };

export default function CodesAdmin({ codes }: { codes: C[] }) {
  const router = useRouter();
  const [f, setF] = useState({ code: "", type: "percent", value: "", maxUses: "", validTo: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(f.value.replace(",", "."));
    const r = await fetch("/api/admin/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: f.code, percent: f.type === "percent" ? Math.round(v) : undefined, amountOff: f.type === "amount" ? v : undefined, maxUses: f.maxUses ? Number(f.maxUses) : undefined, validTo: f.validTo || undefined }),
    });
    setMsg(r.ok ? "Zapisano" : "Sprawdź dane (kod: litery i cyfry)");
    if (r.ok) router.refresh();
  };
  const toggle = async (code: string, active: boolean) => {
    await fetch("/api/admin/codes", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, active }) });
    router.refresh();
  };
  return (
    <div style={{ display: "grid", gap: 30 }}>
      <form onSubmit={create} className="glass" style={{ padding: 22, display: "grid", gap: 14 }}>
        <div className="form-grid">
          <div className="field"><label htmlFor="c-code">Kod</label><input id="c-code" className="input" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></div>
          <div className="field">
            <label htmlFor="c-type">Rodzaj</label>
            <select id="c-type" className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="percent">Procent</option><option value="amount">Kwota (zł)</option></select>
          </div>
          <div className="field"><label htmlFor="c-val">Wartość</label><input id="c-val" className="input" inputMode="decimal" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></div>
          <div className="field"><label htmlFor="c-max">Limit użyć (opcjonalnie)</label><input id="c-max" className="input" type="number" min={1} value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} /></div>
          <div className="field"><label htmlFor="c-to">Ważny do (opcjonalnie)</label><input id="c-to" className="input" type="date" value={f.validTo} onChange={(e) => setF({ ...f, validTo: e.target.value })} /></div>
        </div>
        <div><button className="btn-white" type="submit" disabled={!f.code || !f.value}>Zapisz kod</button></div>
        {msg && <p className="ok">{msg}</p>}
      </form>
      <table>
        <thead><tr><th>Kod</th><th>Rabat</th><th>Użycia</th><th>Ważny do</th><th>Status</th><th /></tr></thead>
        <tbody>
          {codes.map((c) => (
            <tr key={c.code}>
              <td><b style={{ letterSpacing: ".1em" }}>{c.code}</b></td>
              <td>{c.percent ? `${c.percent}%` : `${((c.amountOff ?? 0) / 100).toFixed(2)} zł`}</td>
              <td>{c.uses}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
              <td>{c.validTo ?? "—"}</td>
              <td><span className={`pill ${c.active ? "PAID" : "CANCELLED"}`}>{c.active ? "aktywny" : "wyłączony"}</span></td>
              <td><button className="chip" type="button" onClick={() => toggle(c.code, !c.active)}>{c.active ? "Wyłącz" : "Włącz"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
