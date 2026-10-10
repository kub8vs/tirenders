// Wszystkie teksty strony w PL i EN. Ton: na „Ty”, luźno, z pazurem.

const pl = {
  meta: {
    title: "Tirenders × 2Real Simracing · Warszawa",
    description: "Pierwszy w Polsce salon sim racingu w prawdziwych karoseriach aut. 6 stanowisk, platformy ruchu 5DOF i 6DOF. Warszawa, od 15.11.",
  },
  nav: { offer: "Oferta", pricing: "Cennik", booking: "Rezerwacja", shop: "Sklep", about: "O nas", faq: "FAQ" },
  pill: { status: "Otwarcie 15.11", city: "Warszawa" },
  account: { signIn: "Zaloguj się", account: "Twoje konto" },
  hero: {
    srTitle: "Tirenders × 2Real Simracing – sim racing w prawdziwych karoseriach, Warszawa",
    specs: [
      ["S1", "6", "stanowisk", "Każde rezerwujesz osobno, na planie salonu"],
      ["S2", "6DOF", "ruch", "2 platformy 5DOF i jedna 6DOF"],
      ["S3", "2", "karoserie", "Prawdziwe BMW M4 F82 i Nissan 370Z"],
    ],
    tagline: "Pierwszy taki pit lane w Polsce. Warszawa, od 15.11.",
    cta: "Zarezerwuj już teraz",
    skip: "Pomiń intro",
    gear: "Bieg",
    scroll: "Przewiń",
  },
  home: {
    manifesto: "Ty nie grasz. Ty prowadzisz.",
    manifestoBody:
      "Siadasz w prawdziwym BMW M4. Kierownica z prawdziwego auta, pedały, które stawiają opór, platforma, która rzuca Tobą na każdym krawężniku. Tego nie znajdziesz nigdzie indziej w Polsce.",
    stats: [
      ["6", "stanowisk w salonie"],
      ["3", "platformy ruchu: 2× 5DOF, 1× 6DOF"],
      ["2", "pełne karoserie: BMW M4 F82 i Nissan 370Z"],
    ],
    rigsEyebrow: "Stanowiska",
    rigsTitle: "Wybierz, czym jedziesz.",
    rigsLead: "Każde stanowisko rezerwujesz osobno. Na planie salonu wybierasz dokładnie to, na którym chcesz siedzieć.",
    from: "od",
    soon: "Wkrótce",
    howEyebrow: "Jak to działa",
    howTitle: "Od kliknięcia do startu w 2 minuty.",
    steps: [
      ["Wybierz czas", "15, 30, 45, 60 albo 90 minut. Dłużej? Zadzwoń, ułożymy coś specjalnego."],
      ["Wskaż stanowisko", "Plan salonu pokazuje, co jest wolne o wybranej godzinie."],
      ["Zapłać BLIK-iem", "Albo kartą, Apple Pay, Google Pay, przelewem. Slot trzymamy 10 minut."],
      ["Wjedź na tor", "Dostajesz mail i SMS z kodem QR. Przypomnimy dzień wcześniej i 10 minut przed."],
    ],
    pricingEyebrow: "Cennik",
    pricingTitle: "Płacisz za minuty na torze.",
    pricingCta: "Pełny cennik",
    galleryEyebrow: "Z garażu",
    galleryTitle: "Tak to wygląda od środka.",
    shopEyebrow: "Sklep na miejscu",
    shopTitle: "Kierownice i merch Himery.",
    shopLead: "Kierownice robimy z prawdziwych kierownic samochodowych. Przetestujesz je u nas, zanim kupisz. Na otwarciu w salonie dostaniesz też merch Himery.",
    shopCta: "Zobacz sklep",
    finalTitle: "Pierwszy taki pit lane w Polsce.",
    finalLead: "Warszawa, od 15.11. Zajmij swój slot, zanim zrobią to inni.",
  },
  footer: {
    rights: "Wszystkie prawa zastrzeżone.",
    legal: { terms: "Regulamin", privacy: "Polityka prywatności", cookies: "Cookies" },
    contact: "Kontakt",
    addressSoon: "Adres ogłosimy przed otwarciem",
    phoneSoon: "Numer telefonu wkrótce",
    longer: "Sesje powyżej 90 min i wyłączność całego salonu ustalasz telefonicznie.",
    madeFor: "Tirenders × 2Real Simracing",
  },
};

type Dict = typeof pl;

const en: Dict = {
  meta: {
    title: "Tirenders × 2Real Simracing · Warsaw",
    description: "Poland's first sim racing venue built inside real car bodies. 6 rigs, 5DOF and 6DOF motion platforms. Warsaw, from 15 Nov.",
  },
  nav: { offer: "Offer", pricing: "Pricing", booking: "Book", shop: "Shop", about: "About", faq: "FAQ" },
  pill: { status: "Opening 15 Nov", city: "Warsaw" },
  account: { signIn: "Sign in", account: "Your account" },
  hero: {
    srTitle: "Tirenders × 2Real Simracing – sim racing inside real car bodies, Warsaw",
    specs: [
      ["S1", "6", "rigs", "Each booked on its own, on the venue map"],
      ["S2", "6DOF", "motion", "2 × 5DOF platforms and one 6DOF"],
      ["S3", "2", "car bodies", "A real BMW M4 F82 and Nissan 370Z"],
    ],
    tagline: "Poland's first pit lane of its kind. Warsaw, from 15 Nov.",
    cta: "Book now",
    skip: "Skip intro",
    gear: "Gear",
    scroll: "Scroll",
  },
  home: {
    manifesto: "You don't play. You drive.",
    manifestoBody:
      "You sit in a real BMW M4. A wheel taken from a real car, pedals that push back, a platform that throws you around on every kerb. Nowhere else in Poland.",
    stats: [
      ["6", "rigs in the venue"],
      ["3", "motion platforms: 2× 5DOF, 1× 6DOF"],
      ["2", "full car bodies: BMW M4 F82 and Nissan 370Z"],
    ],
    rigsEyebrow: "Rigs",
    rigsTitle: "Pick your ride.",
    rigsLead: "Every rig is booked on its own. Choose the exact seat on the venue map.",
    from: "from",
    soon: "Soon",
    howEyebrow: "How it works",
    howTitle: "From click to lights out in 2 minutes.",
    steps: [
      ["Pick a duration", "15, 30, 45, 60 or 90 minutes. Longer? Call us and we'll set something up."],
      ["Choose a rig", "The venue map shows what's free at your time."],
      ["Pay with BLIK", "Or card, Apple Pay, Google Pay, bank transfer. We hold the slot for 10 minutes."],
      ["Hit the track", "You get an email and SMS with a QR code. We remind you a day before and 10 minutes before."],
    ],
    pricingEyebrow: "Pricing",
    pricingTitle: "You pay for minutes on track.",
    pricingCta: "Full pricing",
    galleryEyebrow: "From the garage",
    galleryTitle: "What it looks like inside.",
    shopEyebrow: "In-store shop",
    shopTitle: "Wheels and Himera merch.",
    shopLead: "We build our wheels from real car steering wheels. Try them here before you buy. At the opening you can also pick up Himera merch in the venue.",
    shopCta: "See the shop",
    finalTitle: "Poland's first pit lane of its kind.",
    finalLead: "Warsaw, from 15 Nov. Grab your slot before someone else does.",
  },
  footer: {
    rights: "All rights reserved.",
    legal: { terms: "Terms", privacy: "Privacy policy", cookies: "Cookies" },
    contact: "Contact",
    addressSoon: "Address announced before opening",
    phoneSoon: "Phone number coming soon",
    longer: "Sessions over 90 min and full-venue hire are arranged by phone.",
    madeFor: "Tirenders × 2Real Simracing",
  },
};

export const dicts = { pl, en };
export type Lang = keyof typeof dicts;
export type { Dict };
