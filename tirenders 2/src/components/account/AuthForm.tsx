"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const T = {
  pl: {
    title: "Wsiadaj.",
    lead: "Zaloguj się, żeby mieć wszystkie rezerwacje w jednym miejscu.",
    google: "Kontynuuj z Google",
    apple: "Kontynuuj z Apple",
    or: "albo",
    email: "E-mail",
    password: "Hasło",
    name: "Imię i nazwisko",
    phone: "Telefon",
    signin: "Zaloguj się",
    register: "Załóż konto",
    magic: "Wyślij mi link do logowania",
    magicSent: "Sprawdź skrzynkę. Link działa 20 minut.",
    toRegister: "Nie masz konta? Załóż je",
    toLogin: "Masz już konto? Zaloguj się",
    bad: "Zły e-mail albo hasło.",
    exists: "To konto już istnieje. Zaloguj się albo użyj linku na e-mail.",
    invalid: "Hasło musi mieć min. 8 znaków, a imię min. 2 litery.",
    rate: "Za dużo prób. Odczekaj chwilę.",
  },
  en: {
    title: "Jump in.",
    lead: "Sign in to keep all your bookings in one place.",
    google: "Continue with Google",
    apple: "Continue with Apple",
    or: "or",
    email: "Email",
    password: "Password",
    name: "Full name",
    phone: "Phone",
    signin: "Sign in",
    register: "Create account",
    magic: "Email me a sign-in link",
    magicSent: "Check your inbox. The link works for 20 minutes.",
    toRegister: "No account? Create one",
    toLogin: "Already have an account? Sign in",
    bad: "Wrong email or password.",
    exists: "This account already exists. Sign in or use the email link.",
    invalid: "Password needs at least 8 characters and name at least 2 letters.",
    rate: "Too many attempts. Wait a moment.",
  },
};

export default function AuthForm({ lang, next, google, apple, error }: { lang: "pl" | "en"; next: string; google: boolean; apple: boolean; error?: string }) {
  const t = T[lang];
  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({ email: "", password: "", name: "", phone: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(error ? { ok: false, text: t.bad } : null);
  const [busy, setBusy] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);

  const login = async () => {
    const r = await signIn("password", { email: f.email, password: f.password, redirect: false });
    if (r?.ok) window.location.href = next;
    else setMsg({ ok: false, text: t.bad });
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    if (mode === "register") {
      const r = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      if (r.ok) await login();
      else setMsg({ ok: false, text: r.status === 409 ? t.exists : t.invalid });
    } else await login();
    setBusy(false);
  };
  const magic = async () => {
    if (!/\S+@\S+\.\S+/.test(f.email)) return setMsg({ ok: false, text: t.email });
    setBusy(true);
    const r = await fetch("/api/auth/magic", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email, lang, next }) });
    const d = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) {
      setMsg({ ok: true, text: t.magicSent });
      if (d.dev) setDevLink(d.dev);
    } else setMsg({ ok: false, text: r.status === 429 ? t.rate : t.invalid });
  };

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <div>
        <h1 style={{ fontSize: "clamp(52px, 8vw, 96px)" }}>{t.title}</h1>
        <p style={{ marginTop: 14 }}>{t.lead}</p>
      </div>
      {(google || apple) && (
        <div style={{ display: "grid", gap: 10 }}>
          {google && (
            <button type="button" className="btn-white" onClick={() => signIn("google", { callbackUrl: next })}>
              {t.google}
            </button>
          )}
          {apple && (
            <button type="button" className="btn-ghost" style={{ height: 54 }} onClick={() => signIn("apple", { callbackUrl: next })}>
              {t.apple}
            </button>
          )}
          <p style={{ textAlign: "center", color: "var(--dim)", fontSize: 13 }}>{t.or}</p>
        </div>
      )}
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }} noValidate>
        {mode === "register" && (
          <>
            <div className="field">
              <label htmlFor="a-name">{t.name}</label>
              <input id="a-name" className="input" autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="a-phone">{t.phone}</label>
              <input id="a-phone" className="input" type="tel" autoComplete="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="a-email">{t.email}</label>
          <input id="a-email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </div>
        <div className="field">
          <label htmlFor="a-pass">{t.password}</label>
          <input id="a-pass" className="input" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </div>
        <button className="btn-white" type="submit" disabled={busy}>
          {mode === "login" ? t.signin : t.register}
        </button>
        <button className="btn-ghost" type="button" style={{ height: 54 }} disabled={busy} onClick={magic}>
          {t.magic}
        </button>
        {msg && <p className={msg.ok ? "ok" : "err"} role="status">{msg.text}</p>}
        {devLink && (
          <p className="notice">
            Tryb lokalny (bez Resend): <a href={devLink}>otwórz link logowania</a>
          </p>
        )}
        <button type="button" onClick={() => setMode(mode === "login" ? "register" : "login")} style={{ background: "none", border: 0, color: "var(--muted)", cursor: "pointer", textDecoration: "underline", fontSize: 14, justifySelf: "start", padding: 0 }}>
          {mode === "login" ? t.toRegister : t.toLogin}
        </button>
      </form>
    </div>
  );
}
