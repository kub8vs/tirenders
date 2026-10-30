"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SaleForm({ presets }: { presets: { name: string; price: number }[] }) {
  const router = useRouter();
  const [f, setF] = useState({ product: "", category: "MERCH", qty: 1, amount: "", method: "CARD" });
  const [msg, setMsg] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/admin/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, amount: parseFloat(String(f.amount).replace(",", ".")) }) });
    setMsg(r.ok ? "Zapisano" : "Sprawdź dane");
    if (r.ok) {
      setF({ ...f, product: "", amount: "", qty: 1 });
      router.refresh();
    }
  };
  return (
    <form onSubmit={submit} className="glass" style={{ padding: 22, display: "grid", gap: 14 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {presets.map((p) => (
          <button key={p.name} type="button" className="chip" onClick={() => setF({ ...f, product: p.name, category: "MERCH", amount: String(p.price * f.qty) })}>{p.name}</button>
        ))}
      </div>
      <div className="form-grid">
        <div className="field"><label htmlFor="s-p">Produkt</label><input id="s-p" className="input" value={f.product} onChange={(e) => setF({ ...f, product: e.target.value })} /></div>
        <div className="field">
          <label htmlFor="s-c">Kategoria</label>
          <select id="s-c" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
            <option value="MERCH">Merch Himera</option><option value="WHEEL">Kierownica</option><option value="OTHER">Inne</option>
          </select>
        </div>
        <div className="field"><label htmlFor="s-q">Ilość</label><input id="s-q" className="input" type="number" min={1} value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })} /></div>
        <div className="field"><label htmlFor="s-a">Kwota brutto razem (zł)</label><input id="s-a" className="input" inputMode="decimal" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></div>
        <div className="field">
          <label htmlFor="s-m">Płatność</label>
          <select id="s-m" className="input" value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>
            <option value="CARD">Karta</option><option value="CASH">Gotówka</option><option value="BLIK">BLIK</option>
          </select>
        </div>
      </div>
      <div><button className="btn-white" type="submit" disabled={!f.product || !f.amount}>Zapisz sprzedaż</button></div>
      {msg && <p className="ok">{msg}</p>}
    </form>
  );
}
