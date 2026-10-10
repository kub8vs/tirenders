// Przewijająca się taśma haseł (jak banery przy torze). Dwie kopie dla płynnej pętli.
export default function Marquee({ items, reverse, tone = "light" }: { items: string[]; reverse?: boolean; tone?: "light" | "red" | "outline" }) {
  const row = (
    <span className="mq-row">
      {items.map((t, i) => (
        <span key={i}>
          {t}
          <i aria-hidden="true">✦</i>
        </span>
      ))}
    </span>
  );
  return (
    <div className={`marquee ${tone} ${reverse ? "rev" : ""}`} aria-hidden="true">
      <div className="mq-track">
        {row}
        {row}
      </div>
    </div>
  );
}
