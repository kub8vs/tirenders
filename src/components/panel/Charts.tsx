// Proste wykresy w czystym HTML/CSS: działają bez bibliotek i na każdym ekranie.

export function Bars({ data, fmt, title }: { data: { label: string; value: number }[]; fmt: (v: number) => string; title: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="glass">
      <div className="row" style={{ justifyContent: "space-between", padding: "14px 14px 0" }}>
        <b style={{ fontWeight: 500 }}>{title}</b>
        <span className="muted" style={{ fontSize: 13 }}>razem {fmt(data.reduce((s, d) => s + d.value, 0))}</span>
      </div>
      <div className="bars" role="img" aria-label={title}>
        {data.map((d) => <i key={d.label} className={d.value ? "" : "zero"} style={{ height: `${(d.value / max) * 100}%` }} title={`${d.label}: ${fmt(d.value)}`} />)}
      </div>
      <div className="bars-axis"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </div>
  );
}

export function HBars({ rows, fmt }: { rows: { label: string; value: number; note?: string }[]; fmt: (v: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div>
      {rows.map((r) => (
        <div key={r.label} className="hbar">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          <div><i style={{ width: `${(r.value / max) * 100}%` }} /></div>
          <b>{fmt(r.value)}{r.note && <small className="muted" style={{ fontWeight: 400 }}> {r.note}</small>}</b>
        </div>
      ))}
      {!rows.length && <p className="muted" style={{ fontSize: 14 }}>Brak danych w tym okresie.</p>}
    </div>
  );
}

const DAYS = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"];
export function Heat({ grid, hours, max }: { grid: number[][]; hours: number[]; max: number }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div style={{ overflowX: "auto" }}>
      <div className="heat" style={{ gridTemplateColumns: `28px repeat(${hours.length}, minmax(14px, 1fr))`, minWidth: 28 + hours.length * 18 }}>
        <span />
        {hours.map((h) => <span key={h} style={{ textAlign: "center" }}>{h}</span>)}
        {order.map((d) => [
          <span key={`l${d}`}>{DAYS[d]}</span>,
          ...hours.map((h) => <span key={`${d}-${h}`} className="c" title={`${DAYS[d]} ${h}:00 – ${grid[d][h]} rezerwacji`} style={{ background: grid[d][h] ? `rgba(255,42,42,${0.15 + 0.85 * (grid[d][h] / max)})` : "rgba(255,255,255,.04)" }} />),
        ])}
      </div>
    </div>
  );
}
