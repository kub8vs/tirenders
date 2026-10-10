// Produkty z himeradrop.com (stan na 10.10.2026). Sprzedaż stacjonarnie w salonie na otwarciu.
export const HIMERA = [
  { id: "kominiarka", name: { pl: "Kominiarka Himery", en: "Himera balaclava" }, price: 139.99, img: "/img/himera/wkrotce-dostepne-g0.jpg", soon: true },
  { id: "flaga", name: { pl: "Flaga Himery", en: "Himera flag" }, price: 49.99, img: "/img/himera/flaga-himery-g0.jpg", soon: false },
  { id: "logo-czarne", name: { pl: "Naklejka na auto · logo, czarna", en: "Car sticker · logo, black" }, price: 29.99, img: "/img/himera/naklejka-na-samochod-logo-himery-1-g0.png", soon: false },
  { id: "logo-biale", name: { pl: "Naklejka na auto · logo, biała", en: "Car sticker · logo, white" }, price: 29.99, img: "/img/himera/naklejka-na-samochod-logo-himery-g0.png", soon: false },
  { id: "napis", name: { pl: "Naklejka na auto · napis HIMERA, biała", en: "Car sticker · HIMERA lettering, white" }, price: 29.99, img: "/img/himera/naklejka-g0.png", soon: false },
];

// 6 zdjęć produktów Himery na podstronie sklepu.
export const HIMERA_PHOTOS = [
  "wkrotce-dostepne-g0.jpg",
  "flaga-himery-g1.jpg",
  "naklejka-na-samochod-logo-himery-g1.jpg",
  "wkrotce-dostepne-g1.jpg",
  "naklejka-g1.jpg",
  "naklejka-na-samochod-logo-himery-1-g1.jpg",
].map((f) => ({ src: `/img/himera/${f}`, alt: "Himera" }));
