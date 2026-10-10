// Jedno miejsce na dane, które Tirenders jeszcze potwierdza.
// Wszystko oznaczone TODO to wartości przykładowe.

export const SITE = {
  brand: "Tirenders",
  salon: "2Real Simracing",
  city: "Warszawa",
  openingDate: "2026-11-15", // TODO: potwierdzić dokładny dzień otwarcia
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
  freeCancelHours: 24,
  rescheduleHours: 3,
};

export type PriceGroup = "STANDARD" | "GT3" | "MOTION5" | "MOTION6";
export type Duration = (typeof BOOKING.durations)[number];

// TODO: ceny przykładowe (ankieta: „ustal przykładowe ceny”). Kwoty brutto w PLN.
export const PRICES: Record<PriceGroup, Record<Duration, number>> = {
  STANDARD: { 15: 39, 30: 69, 45: 99, 60: 129, 90: 179 },
  GT3: { 15: 45, 30: 79, 45: 115, 60: 149, 90: 209 },
  MOTION5: { 15: 49, 30: 89, 45: 129, 60: 169, 90: 239 },
  MOTION6: { 15: 59, 30: 105, 45: 149, 60: 199, 90: 279 },
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

// 6 stanowisk wg Tirenders (10.10.2026).
export const SIMULATORS: SimDef[] = [
  { id: "bmw-m4", name: "BMW M4 F82", body: { pl: "Pełna karoseria BMW M4 F82, oryginalny kokpit", en: "Full BMW M4 F82 body, original cockpit" }, priceGroup: "STANDARD", status: "ACTIVE", dof: null, plan: { x: 18, y: 28, r: -8 } },
  { id: "dof5-a", name: "Motion 5DOF #1", body: { pl: "Platforma ruchu 5DOF: czujesz każdy krawężnik", en: "5DOF motion platform: feel every kerb" }, priceGroup: "MOTION5", status: "ACTIVE", dof: 5, plan: { x: 40, y: 22, r: 0 } },
  { id: "dof5-b", name: "Motion 5DOF #2", body: { pl: "Druga platforma 5DOF: ścigaj się z kumplem obok", en: "Second 5DOF rig: race your mate side by side" }, priceGroup: "MOTION5", status: "ACTIVE", dof: 5, plan: { x: 60, y: 22, r: 0 } },
  { id: "dof6", name: "Motion 6DOF", body: { pl: "Pełne 6 stopni swobody. Najmocniejsze stanowisko w salonie", en: "Full 6 degrees of freedom. The heaviest hitter in the room" }, priceGroup: "MOTION6", status: "ACTIVE", dof: 6, plan: { x: 82, y: 28, r: 8 } },
  { id: "gt3", name: "GT3 Cockpit", body: { pl: "Kokpit wyścigowy GT3: kubeł, pasy, kierownica formułowa", en: "GT3 race cockpit: bucket seat, harness, formula wheel" }, priceGroup: "GT3", status: "ACTIVE", dof: null, plan: { x: 32, y: 70, r: -4 } },
  { id: "nissan-370z", name: "Nissan 370Z", body: { pl: "Pełna karoseria Nissana 370Z (w budowie)", en: "Full Nissan 370Z body (being built)" }, priceGroup: "STANDARD", status: "COMING_SOON", dof: null, plan: { x: 68, y: 70, r: 4 } },
];

export const simById = (id: string) => SIMULATORS.find((s) => s.id === id);
export const priceFor = (group: PriceGroup, d: Duration) => PRICES[group][d];
