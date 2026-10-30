"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SetPassword({ token, email }: { token: string | null; email: string | null }) {
  const [p, setP] = useState({ a: "", b: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!token || !email)
    return (
      <div className="glass" style={{ padding: 26, display: "grid", gap: 14 }}>
        <h1 style={{ fontSize: 24, margin: 0 }}>Link wygasł</h1>
        <p className="muted">Ten link był już użyty albo minęły 24 godziny. Poproś o nowy na stronie logowania.</p>
        <a className="btn-white" href="/panel/logowanie">Do logowania</a>
      </div>
    );
  const weak = p.a.length < 10;
  const save = async () => {
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/panel/haslo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: p.a }) });
    if (!r.ok) {
      setBusy(false);
      return setMsg("Nie udało się. Link mógł wygasnąć, poproś o nowy.");
    }
    await signIn("password", { email, password: p.a, redirect: false });
    window.location.href = "/panel";
  };
  return (
    <form className="glass" style={{ padding: 26, display: "grid", gap: 16 }} onSubmit={(e) => { e.preventDefault(); save(); }}>
      <h1 style={{ fontSize: 24, margin: 0 }}>Ustaw hasło</h1>
      <p className="muted" style={{ fontSize: 14, wordBreak: "break-all" }}>Konto: {email}</p>
      <input type="email" value={email} autoComplete="username" readOnly hidden />
      <div className="field">
        <label htmlFor="sp-a">Nowe hasło (min. 10 znaków)</label>
        <input id="sp-a" className="input" type="password" autoComplete="new-password" value={p.a} onChange={(e) => setP({ ...p, a: e.target.value })} />
      </div>
      <div className="field">
        <label htmlFor="sp-b">Powtórz hasło</label>
        <input id="sp-b" className="input" type="password" autoComplete="new-password" value={p.b} onChange={(e) => setP({ ...p, b: e.target.value })} />
      </div>
      {p.b && p.a !== p.b && <p className="err">Hasła się różnią.</p>}
      <button className="btn-white" type="submit" disabled={busy || weak || p.a !== p.b}>Zapisz i wejdź do panelu</button>
      {msg && <p className="err" role="status">{msg}</p>}
    </form>
  );
}
