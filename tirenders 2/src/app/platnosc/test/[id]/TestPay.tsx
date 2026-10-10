"use client";

import { useState } from "react";

export default function TestPay({ id, status }: { id: string; status: string }) {
  const [busy, setBusy] = useState(false);
  const pay = async (method: string) => {
    setBusy(true);
    await fetch(`/api/test-pay/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ method }) });
    window.location.href = `/rezerwacja/sukces?b=${id}`;
  };
  if (status !== "PENDING") return <p style={{ marginTop: 20 }}>Status: {status}</p>;
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 30 }}>
      <button className="btn-white" disabled={busy} onClick={() => pay("blik")}>Zapłać BLIK (test)</button>
      <button className="btn-ghost" style={{ height: 54 }} disabled={busy} onClick={() => pay("card")}>Karta (test)</button>
      <a className="btn-ghost" style={{ height: 54 }} href={`/rezerwacja/anulowano?b=${id}`}>Anuluj</a>
    </div>
  );
}
