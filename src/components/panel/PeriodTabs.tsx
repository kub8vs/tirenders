import Link from "next/link";

export const PERIODS = { "7": "7 dni", "30": "30 dni", "90": "90 dni", "365": "Rok" } as const;
export const periodOf = (p?: string) => (p && p in PERIODS ? Number(p) : 30);

export default function PeriodTabs({ base, current }: { base: string; current: number }) {
  return (
    <div className="row no-print">
      {Object.entries(PERIODS).map(([k, v]) => (
        <Link key={k} href={`${base}?p=${k}`} className="btn-ghost" style={{ height: 38, padding: "0 14px", fontSize: 13, ...(Number(k) === current ? { background: "#fff", color: "#000", borderColor: "#fff" } : {}) }}>{v}</Link>
      ))}
    </div>
  );
}
