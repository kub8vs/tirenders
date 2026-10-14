// Nagrania z sesji Tirenders / 2Real (dysk klienta), przycięte i podbarwione pod stronę.
// Pliki leżą w public/video: .mp4 (H.264, bez dźwięku) + plakat .mp4.jpg.

export type Clip = { src: string; poster: string };

const clip = (name: string): Clip => ({ src: `/video/${name}.mp4`, poster: `/video/${name}.mp4.jpg` });

// Showreel „W akcji” na stronie głównej (prawdziwe M4 na torze + stanowiska M4 i E46).
export const REEL = clip("reel");

// Pętle na stronach stanowisk. Pozostałe stanowiska dostaną nagrania po sesji zdjęciowej.
export const SIM_CLIPS: Record<string, Clip | undefined> = {
  "bmw-m4": clip("bmw-m4"),
  "bmw-e46": clip("bmw-e46"),
};
