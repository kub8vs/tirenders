// Jedno miejsce na dane, które Tirenders jeszcze potwierdza.
// Wszystko oznaczone TODO to wartości przykładowe.

export const SITE = {
  brand: "Tirenders",
  salon: "2Real Simracing",
  city: "Warszawa",
  openingDate: "2026-11-14", // TODO: potwierdzić godzinę otwarcia
  address: null as string | null, // TODO: adres salonu („nie wiadomo jeszcze”)
  phone: null as string | null, // TODO: numer do rezerwacji > 90 min i wyłączności salonu
  email: "rezerwacje@tirenders.pl", // TODO: adres po zakupie domeny
  instagram: {
    tirenders: "https://www.instagram.com/tirenders_/",
    salon: "https://www.instagram.com/2realsimracing/",
    himera: "https://www.instagram.com/x.himera/",
  },
  himeraShop: "https://himeradrop.com",
  timezone: "Europe/Warsaw",
  vatRate: 23,
};

// Godziny otwarcia: 0 = niedziela … 6 = sobota. TODO: Tirenders podaje „nie wiem” – to przykład.
export const HOURS: Record<number, { open: string; close: string } | null> = {
  0: { open: "12:00", close: "22:00" },
  1: { open: "14:00", close: "22:00" },
  2: { open: "14:00", close: "22:00" },
  3: { open: "14:00", close: "22:00" },
  4: { open: "14:00", close: "22:00" },
  5: { open: "12:00", close: "24:00" },
  6: { open: "10:00", close: "24:00" },
};

export const BOOKING = {
  durations: [15, 30, 45, 60, 90] as const,
  slotStepMin: 15, // sesje startują co 15 min
  bufferMin: 15, // przerwa po każdej sesji (ankieta: 15–20 min)
  minLeadMin: 60, // najpóźniej godzinę przed
  maxDaysAhead: 14, // maks. 2 tygodnie do przodu
  holdMin: 10, // tyle czasu slot czeka na płatność
  payLinkHours: 24, // rezerwacja przez telefon: tyle czasu klient ma na zapłatę linkiem z SMS-a (Stripe pozwala maks. 24 h)
  freeCancelHours: 12, // > 12 h przed: odwołanie i zwrot 100%
  rescheduleHours: 2, // 12–2 h przed: tylko zmiana terminu; < 2 h: nic
  arriveEarlyMin: 15, // prosimy być w salonie 15 min przed startem
};

export type PriceGroup = "STANDARD" | "GT3" | "MOTION5" | "MOTION6";
export type Duration = (typeof BOOKING.durations)[number];

// Cennik od Tirenders (14.10.2026). Kwoty brutto w PLN (z VAT, tyle płaci klient).
// Rękawiczki (5 zł) są już wliczone w każdą cenę.
export const GLOVES_PRICE = 5;
export const PRICES: Record<PriceGroup, Record<Duration, number>> = {
  STANDARD: { 15: 79, 30: 99, 45: 139, 60: 179, 90: 229 },
  GT3: { 15: 49, 30: 79, 45: 109, 60: 129, 90: 179 },
  MOTION5: { 15: 79, 30: 129, 45: 189, 60: 209, 90: 279 },
  MOTION6: { 15: 79, 30: 179, 45: 269, 60: 299, 90: 399 },
};

export type SimDef = {
  id: string;
  name: string;
  body: { pl: string; en: string };
  priceGroup: PriceGroup;
  status: "ACTIVE" | "COMING_SOON" | "OUT_OF_SERVICE";
  dof: number | null;
  // pozycja na planie salonu (0–100)
  plan: { x: number; y: number; r: number };
};

// 7 stanowisk wg Tirenders (14.10.2026): BMW E46 dołączyło jako trzecia karoseria.
export const SIMULATORS: SimDef[] = [
  { id: "bmw-m4", name: "BMW M4 F82", body: { pl: "Pełna karoseria BMW M4 F82, oryginalny kokpit", en: "Full BMW M4 F82 body, original cockpit" }, priceGroup: "STANDARD", status: "ACTIVE", dof: null, plan: { x: 13, y: 26, r: -8 } },
  { id: "bmw-e46", name: "BMW E46", body: { pl: "Pełna karoseria BMW E46, oryginalny kokpit", en: "Full BMW E46 body, original cockpit" }, priceGroup: "STANDARD", status: "ACTIVE", dof: null, plan: { x: 18, y: 64, r: -4 } },
  { id: "dof5-a", name: "Motion 5DOF #1", body: { pl: "Platforma ruchu 5DOF: czujesz każdy krawężnik", en: "5DOF motion platform: feel every kerb" }, priceGroup: "MOTION5", status: "ACTIVE", dof: 5, plan: { x: 37, y: 22, r: 0 } },
  { id: "dof5-b", name: "Motion 5DOF #2", body: { pl: "Druga platforma 5DOF: ścigaj się z kumplem obok", en: "Second 5DOF rig: race your mate side by side" }, priceGroup: "MOTION5", status: "ACTIVE", dof: 5, plan: { x: 62, y: 22, r: 0 } },
  { id: "dof6", name: "Motion 6DOF", body: { pl: "Pełne 6 stopni swobody. Najmocniejsze stanowisko w salonie", en: "Full 6 degrees of freedom. The heaviest hitter in the room" }, priceGroup: "MOTION6", status: "ACTIVE", dof: 6, plan: { x: 87, y: 26, r: 8 } },
  { id: "gt3", name: "GT3 Cockpit", body: { pl: "Kokpit wyścigowy GT3: kubeł, pasy, kierownica formułowa", en: "GT3 race cockpit: bucket seat, harness, formula wheel" }, priceGroup: "GT3", status: "ACTIVE", dof: null, plan: { x: 50, y: 62, r: 0 } },
  { id: "nissan-370z", name: "Nissan 370Z", body: { pl: "Pełna karoseria Nissana 370Z (w budowie)", en: "Full Nissan 370Z body (being built)" }, priceGroup: "STANDARD", status: "COMING_SOON", dof: null, plan: { x: 82, y: 64, r: 4 } },
];

export const simById = (id: string) => SIMULATORS.find((s) => s.id === id);
export const priceFor = (group: PriceGroup, d: Duration) => PRICES[group][d];

// Rabaty grupowe (14.10.2026): kilka stanowisk na tę samą godzinę w jednej rezerwacji.
// Cały salon = wszystkie aktywne stanowiska naraz. Rabat nie łączy się z kodem: liczy się większy.
export const GROUP_DISCOUNTS = [
  { min: 3, percent: 10 },
  { min: 5, percent: 15 },
] as const;
export const WHOLE_SALON_PERCENT = 25;
export const activeSims = () => SIMULATORS.filter((s) => s.status === "ACTIVE");
export function groupPercent(count: number) {
  if (count >= 2 && count >= activeSims().length) return WHOLE_SALON_PERCENT;
  return GROUP_DISCOUNTS.reduce((p, t) => (count >= t.min ? t.percent : p), 0 as number);
}
