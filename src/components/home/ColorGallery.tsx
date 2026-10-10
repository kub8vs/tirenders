// Galeria w dwóch taśmach jadących w przeciwne strony, zdjęcia w naturalnych kolorach.
const ROW_A = ["/img/ig/tirenders-post-1.jpg", "/img/ig/tirenders-6.jpg", "/img/ig/tirenders-3.jpg", "/img/ig/tirenders-post-2.jpg", "/img/ig/tirenders-8.jpg", "/img/ig/2real-1.jpg"];
const ROW_B = ["/img/ig/tirenders-5.jpg", "/img/ig/tirenders-9.jpg", "/img/ig/tirenders-4.jpg", "/img/ig/tirenders-7.jpg", "/img/ig/tirenders-10.jpg", "/img/himera/wkrotce-dostepne-g0.jpg"];

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
