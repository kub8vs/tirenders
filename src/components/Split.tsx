// Tekst podzielony na słowa w maskach – animuje je <Motion /> (atrybut data-split).
// Słowa w *gwiazdkach* dostają akcent: wyścigowy krój z chromowanym połyskiem jak w logo.
export default function Split({ text, as: Tag = "h2", className, style }: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; style?: React.CSSProperties }) {
  const words = text.split(" ");
  let acc = false;
  return (
    <Tag className={className} style={style} data-split aria-label={text.replace(/\*/g, "")}>
      {words.map((raw, i) => {
        const start = raw.startsWith("*");
        if (start) acc = true;
        const on = acc;
        if (raw.endsWith("*")) acc = false;
        const w = raw.replace(/\*/g, "");
        return (
          <span key={i} aria-hidden="true">
            <span className="sw">
              <span className={on ? "swi acc" : "swi"}>{w}</span>
            </span>
            {i < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </Tag>
  );
}
