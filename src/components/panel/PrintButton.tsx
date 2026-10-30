"use client";

export default function PrintButton() {
  return <button className="btn-white" type="button" style={{ height: 46 }} onClick={() => window.print()}>Drukuj</button>;
}
