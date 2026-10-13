// Tekst z wyróżnieniami: fragmenty w *gwiazdkach* stają się białe z czerwonym podkreśleniem markerem,
// żeby oko łapało najważniejsze słowa nawet przy szybkim przewijaniu.
export function plain(text: string) {
  return text.replace(/\*/g, "");
}

export default function Rich({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <em className="hl" key={i}>
            {p}
          </em>
        ) : (
          p
        ),
      )}
    </>
  );
}
