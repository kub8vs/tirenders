// Wszystkie teksty strony w PL i EN. Ton: na „Ty”, luźno, z pazurem.

const pl = {
  meta: {
    title: "Tirenders × 2Real Simracing · Warszawa",
    description: "Pierwszy w Polsce salon sim racingu w prawdziwych karoseriach aut. 7 stanowisk, platformy ruchu 5DOF i 6DOF. Warszawa, od 15.11.",
  },
  nav: { offer: "Oferta", pricing: "Cennik", booking: "Rezerwacja", shop: "Sklep", about: "O nas", faq: "FAQ" },
  pill: { status: "Otwarcie 15.11", city: "Warszawa" },
  account: { signIn: "Zaloguj się", account: "Twoje konto" },
  hero: {
    srTitle: "Tirenders × 2Real Simracing – sim racing w prawdziwych karoseriach, Warszawa",
    specs: [
      ["S1", "7", "stanowisk", "Swoje wybierasz na planie salonu"],
      ["S2", "6DOF", "ruch", "2× 5DOF i 1× 6DOF. Czujesz każdy krawężnik"],
      ["S3", "3", "karoserie", "Prawdziwe BMW M4 F82, BMW E46 i Nissan 370Z"],
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
      "Siadasz w *prawdziwym BMW M4*. Kierownica z auta, pedały, które stawiają opór, i platforma, która rzuca Tobą na krawężnikach. *Nigdzie indziej w Polsce.*",
    stats: [
      ["7", "stanowisk w salonie"],
      ["3", "platformy ruchu: 2× 5DOF, 1× 6DOF"],
      ["3", "pełne karoserie: BMW M4 F82, BMW E46 i Nissan 370Z"],
    ],
    rigsEyebrow: "Stanowiska",
    rigsTitle: "Wybierz, *czym jedziesz.*",
    rigsLead: "Każde stanowisko rezerwujesz osobno. *Ty wybierasz miejsce* na planie salonu.",
    from: "od",
    soon: "Wkrótce",
    reelEyebrow: "W akcji",
    reelTitle: "Z toru *prosto do salonu.*",
    howEyebrow: "Jak to działa",
    howTitle: "Od kliknięcia do startu: *2 minuty.*",
    steps: [
      ["Wybierz czas", "Od 15 do 90 minut. Dłużej? Zadzwoń."],
      ["Wskaż stanowisko", "Na planie salonu widzisz, co jest wolne."],
      ["Zapłać BLIK-iem", "Albo kartą, Apple Pay, Google Pay. Slot trzymamy 10 minut."],
      ["Wjedź na tor", "Kod QR dostajesz mailem i SMS-em. O starcie przypomnimy."],
    ],
    pricingEyebrow: "Cennik",
    pricingTitle: "Płacisz za *minuty na torze.*",
    pricingCta: "Pełny cennik",
    galleryEyebrow: "Z garażu",
    galleryTitle: "Tak to wygląda *od środka.*",
    shopEyebrow: "Sklep na miejscu",
    shopTitle: "Kierownice i *merch Himery.*",
    shopLead: "Kierownice z *prawdziwych aut*. Najpierw testujesz u nas, potem kupujesz. Na otwarciu także *merch Himery.*",
    shopCta: "Zobacz sklep",
    finalTitle: "Pierwszy taki *pit lane* w Polsce.",
    finalLead: "Warszawa, od 15.11. *Umów swoją jazdę*, zanim zrobią to inni.",
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
    description: "Poland's first sim racing venue built inside real car bodies. 7 rigs, 5DOF and 6DOF motion platforms. Warsaw, from 15 Nov.",
  },
  nav: { offer: "Offer", pricing: "Pricing", booking: "Book", shop: "Shop", about: "About", faq: "FAQ" },
  pill: { status: "Opening 15 Nov", city: "Warsaw" },
  account: { signIn: "Sign in", account: "Your account" },
  hero: {
    srTitle: "Tirenders × 2Real Simracing – sim racing inside real car bodies, Warsaw",
    specs: [
      ["S1", "7", "rigs", "Pick yours on the venue map"],
      ["S2", "6DOF", "motion", "2× 5DOF and 1× 6DOF. Feel every kerb"],
      ["S3", "3", "car bodies", "A real BMW M4 F82, BMW E46 and Nissan 370Z"],
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
      "You sit in a *real BMW M4*. A wheel from the car, pedals that push back and a platform that throws you around on the kerbs. *Nowhere else in Poland.*",
    stats: [
      ["7", "rigs in the venue"],
      ["3", "motion platforms: 2× 5DOF, 1× 6DOF"],
      ["3", "full car bodies: BMW M4 F82, BMW E46 and Nissan 370Z"],
    ],
    rigsEyebrow: "Rigs",
    rigsTitle: "Pick *your ride.*",
    rigsLead: "Every rig is booked on its own. *You pick the seat* on the venue map.",
    from: "from",
    soon: "Soon",
    reelEyebrow: "In action",
    reelTitle: "From the track *to the venue.*",
    howEyebrow: "How it works",
    howTitle: "From click to lights out: *2 minutes.*",
    steps: [
      ["Pick a duration", "15 to 90 minutes. Longer? Call us."],
      ["Choose a rig", "The venue map shows what's free."],
      ["Pay with BLIK", "Or card, Apple Pay, Google Pay. We hold the slot for 10 minutes."],
      ["Hit the track", "Your QR code comes by email and SMS. We'll remind you."],
    ],
    pricingEyebrow: "Pricing",
    pricingTitle: "You pay for *minutes on track.*",
    pricingCta: "Full pricing",
    galleryEyebrow: "From the garage",
    galleryTitle: "What it looks like *inside.*",
    shopEyebrow: "In-store shop",
    shopTitle: "Wheels and *Himera merch.*",
    shopLead: "Wheels made from *real car wheels*. Try them here first, then buy. At the opening, *Himera merch* too.",
    shopCta: "See the shop",
    finalTitle: "Poland's first *pit lane* of its kind.",
    finalLead: "Warsaw, from 15 Nov. *Book your drive* before someone else does.",
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
