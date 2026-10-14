// Galeria w dwóch taśmach jadących w przeciwne strony, zdjęcia w naturalnych kolorach.
const ROW_A = ["/img/foto/supra-nad-symulatorem.webp", "/img/foto/kokpit-symulator.webp", "/img/foto/baltic-supra.webp", "/img/foto/drift-m3.webp", "/img/foto/ekipa-tirenders.webp", "/img/foto/supra-2real.webp", "/img/foto/baltic-namiot.webp"];
const ROW_B = ["/img/foto/m4-noc.webp", "/img/foto/silnik-m.webp", "/img/foto/baltic-supra-2.webp", "/img/foto/drift-czarne-m.webp", "/img/foto/bluza-tirenders.webp", "/img/foto/symulator-transport.webp", "/img/foto/wiszaca-supra.webp"];

function Row({ imgs, reverse, offset }: { imgs: string[]; reverse?: boolean; offset: number }) {
  const items = [...imgs, ...imgs];
  return (
    <div className={`cg-row ${reverse ? "rev" : ""}`}>
      <div className="cg-track">
        {items.map((src, i) => (
          <figure key={i} className={`cg-item ${(i + offset) % 3 === 0 ? "wide" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" loading="lazy" />
          </figure>
        ))}
      </div>
    </div>
  );
}

export default function ColorGallery() {
  return (
    <div className="cg">
      <Row imgs={ROW_A} offset={0} />
      <Row imgs={ROW_B} reverse offset={3} />
    </div>
  );
}
