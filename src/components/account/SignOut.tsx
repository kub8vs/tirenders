"use client";

import { signOut } from "next-auth/react";

export default function SignOut({ label }: { label: string }) {
  return (
    <button type="button" className="btn-ghost" style={{ height: 50 }} onClick={() => signOut({ callbackUrl: "/" })}>
      {label}
    </button>
  );
}
