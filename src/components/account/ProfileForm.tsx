"use client";

import { useState } from "react";

export default function ProfileForm({ lang, name, phone }: { lang: "pl" | "en"; name: string; phone: string }) {
  const [f, setF] = useState({ name, phone });
  const [msg, setMsg] = useState<string | null>(null);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await fetch("/api/account", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    setMsg(r.ok ? (lang === "pl" ? "Zapisano" : "Saved") : lang === "pl" ? "Sprawdź imię (min. 2 litery)" : "Check your name (min. 2 letters)");
  };
  return (
    <form onSubmit={save} style={{ display: "grid", gap: 12 }}>
      <div className="field">
        <label htmlFor="p-name">{lang === "pl" ? "Imię i nazwisko" : "Full name"}</label>
        <input id="p-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="p-phone">{lang === "pl" ? "Telefon" : "Phone"}</label>
        <input id="p-phone" className="input" type="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
      </div>
      <button className="btn-ghost" type="submit">{lang === "pl" ? "Zapisz" : "Save"}</button>
      {msg && <span className="ok" role="status">{msg}</span>}
    </form>
  );
}
