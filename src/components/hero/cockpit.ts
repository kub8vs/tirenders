// Zdjęcie kokpitu (public/img/kokpit-m4.webp, 1024×767, szyba przezroczysta) rozciągnięte jak object-fit: cover.
// Ten sam układ liczy Hero (pozycja zdjęcia i ekranu zegarów) i scena WebGL (tor widoczny w szybie).

export const COCKPIT = {
  src: "/img/kokpit-m4.webp",
  w: 1024,
  h: 767,
  focusX: 505, // kierownica: na wąskich ekranach kadr trzyma ją na środku
  focusY: 310,
  aimX: 505, // punkt na wprost kierowcy, tu kamera patrzy w trakcie startu
  aimY: 232,
  glassH: 225, // wysokość szyby przedniej w pikselach zdjęcia
  exitAt: 3.4, // s po zielonym świetle kokpit znika
};

export function cockpitBox(vw: number, vh: number) {
  const s = Math.max(vw / COCKPIT.w, vh / COCKPIT.h);
  const w = COCKPIT.w * s;
  const h = COCKPIT.h * s;
  const x = Math.min(0, Math.max(vw - w, vw / 2 - COCKPIT.focusX * s));
  const y = Math.min(0, Math.max(vh - h, vh / 2 - COCKPIT.focusY * s));
  return { s, x, y, w, h };
}
