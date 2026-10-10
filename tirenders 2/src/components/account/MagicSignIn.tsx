"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useEffect, useRef, useState } from "react";

export default function MagicSignIn({ token, next }: { token: string; next: string }) {
  const [failed, setFailed] = useState(false);
  const once = useRef(false);
  useEffect(() => {
    if (once.current) return;
    once.current = true;
    signIn("magic", { token, redirect: false }).then((r) => {
      if (r?.ok) window.location.href = next;
      else setFailed(true);
    });
  }, [token, next]);
  return failed ? (
    <>
      <h1>Link wygasł albo został już użyty.</h1>
      <p>Wyślij sobie nowy na stronie logowania.</p>
      <div style={{ marginTop: 30 }}>
        <Link className="btn-white" href="/konto/logowanie">Logowanie</Link>
      </div>
    </>
  ) : (
    <h1>Logowanie…</h1>
  );
}
