export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="wrap page-hero">
      <h1 style={{ fontSize: "clamp(44px, 6vw, 96px)" }}>{title}</h1>
      <p style={{ fontSize: 14 }}>Wersja z {updated}</p>
      <div className="notice" style={{ marginTop: 30, maxWidth: "74ch" }}>
        Szkic do weryfikacji przez prawnika przed startem sprzedaży. Uzupełnij dane w nawiasach kwadratowych.
      </div>
      <div className="prose" style={{ marginTop: 20 }}>{children}</div>
    </div>
  );
}
