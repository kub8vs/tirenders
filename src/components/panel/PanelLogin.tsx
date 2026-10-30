"use client";

import { signIn, signOut } from "next-auth/react";
import { useState } from "react";

export default function PanelLogin({ wrongAccount }: { wrongAccount: boolean }) {
  const [f, setF] = useState({ email: "", password: "" });
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    setMsg(null);
    const r = await signIn("password", { email: f.email, password: f.password, redirect: false });
    setBusy(false);
    if (r?.ok) return void (window.location.href = "/panel");
    setMsg({ ok: false, text: r?.error === "rate" ? "Za dużo prób. Odczekaj 15 minut albo ustaw nowe hasło." : "Zły e-mail albo hasło." });
  };
  const reset = async () => {
    setBusy(true);
    const r = await fetch("/api/panel/link", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok
      ? { ok: true, text: d.dev ? `Tryb testowy, link: ${d.dev}` : "Jeśli to konto zespołu, wysłaliśmy link do ustawienia hasła. Działa 24 godziny." }
      : { ok: false, text: "Za dużo prób. Odczekaj chwilę." });
  };

  return (
    <form className="glass" style={{ padding: 26, display: "grid", gap: 16 }} onSubmit={(e) => { e.preventDefault(); mode === "login" ? login() : reset(); }}>
      <h1 style={{ fontSize: 26, margin: 0 }}>{mode === "login" ? "Panel salonu" : "Ustaw hasło"}</h1>
      {wrongAccount && <p className="err">Jesteś zalogowany kontem gościa. <button type="button" onClick={() => signOut({ callbackUrl: "/panel/logowanie" })} style={{ background: "none", border: 0, color: "inherit", textDecoration: "underline", cursor: "pointer", font: "inherit" }}>Wyloguj</button> i wejdź kontem zespołu.</p>}
      {mode === "reset" && <p className="muted" style={{ fontSize: 14 }}>Pierwsze logowanie albo zapomniane hasło: wpisz swój e-mail, a wyślemy link do ustawienia hasła.</p>}
      <div className="field">
        <label htmlFor="pl-email">E-mail</label>
        <input id="pl-email" className="input" type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
      </div>
      {mode === "login" && (
        <div className="field">
          <label htmlFor="pl-pass">Hasło</label>
          <input id="pl-pass" className="input" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
        </div>
      )}
      <button className="btn-white" type="submit" disabled={busy || !f.email || (mode === "login" && !f.password)}>{mode === "login" ? "Zaloguj się" : "Wyślij link"}</button>
      {msg && <p className={msg.ok ? "ok" : "err"} role="status" style={{ wordBreak: "break-all" }}>{msg.text}</p>}
      <button type="button" onClick={() => { setMode(mode === "login" ? "reset" : "login"); setMsg(null); }} style={{ background: "none", border: 0, color: "var(--muted)", textDecoration: "underline", cursor: "pointer", font: "inherit", fontSize: 14 }}>
        {mode === "login" ? "Pierwsze logowanie albo nie pamiętam hasła" : "Wróć do logowania"}
      </button>
    </form>
  );
}
