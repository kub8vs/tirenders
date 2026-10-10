// Tekst podzielony na słowa w maskach – animuje je <Motion /> (atrybut data-split).
export default function Split({ text, as: Tag = "h2", className, style }: { text: string; as?: "h1" | "h2" | "h3" | "p"; className?: string; style?: React.CSSProperties }) {
  const words = text.split(" ");
  return (
    <Tag className={className} style={style} data-split aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className="sw">
            <span className="swi">{w}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
