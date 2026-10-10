import Link from "next/link";
import Split from "@/components/Split";
import { SITE } from "@/config/site";
import PhotoGallery from "@/components/shop/PhotoGallery";
import { HIMERA_PHOTOS } from "@/content/himera";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Sklep: kierownice i merch Himery" };

export default function Page() {
  const l = getLang();
  const wheelPoints = [
    { pl: ["Z prawdziwych aut", "Bierzemy oryginalną kierownicę samochodową i przerabiamy ją na kierownicę do sim racingu. Ten sam chwyt, ta sama skóra, to samo logo."], en: ["From real cars", "We take an original car steering wheel and convert it for sim racing. Same grip, same leather, same badge."] },
    { pl: ["Przetestuj, zanim kupisz", "Każdą kierownicę możesz sprawdzić na naszych stanowiskach. Powiedz obsłudze, którą chcesz przetestować."], en: ["Try before you buy", "You can test every wheel on our rigs. Tell the staff which one you want to try."] },
    { pl: ["Kupujesz na miejscu", "Sprzedajemy w salonie w Warszawie. Doradzimy, z jaką bazą będzie działać i jak ją zamontować."], en: ["Buy in the venue", "We sell in our Warsaw venue. We'll tell you which wheelbase it works with and how to mount it."] },
  ];
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow">{tr(l, { pl: "Sklep w salonie", en: "In-store shop" })}</p>
        <Split as="h1" text={tr(l, { pl: "Kierownice i merch.", en: "Wheels and merch." })} />
        <p>{tr(l, { pl: "Wszystko kupisz na miejscu w Warszawie. Bez wysyłek, bez czekania: bierzesz do ręki, sprawdzasz, zabierasz.", en: "Everything is sold on site in Warsaw. No shipping, no waiting: pick it up, try it, take it home." })}</p>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <div className="sec-head" data-reveal style={{ marginBottom: 40 }}>
              <p className="eyebrow">{tr(l, { pl: "Kierownice sim racingowe", en: "Sim racing wheels" })}</p>
              <Split className="sec-title" style={{ fontSize: "clamp(36px, 4.6vw, 72px)" }} text={tr(l, { pl: "Kierownica z Twojego auta. Na Twoim biurku.", en: "The wheel from your car. On your desk." })} />
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {wheelPoints.map((p, i) => (
                <div className="card glass" key={i} data-reveal data-delay={i * 90}>
                  <h3>{p[l][0]}</h3>
                  <p>{p[l][1]}</p>
                </div>
              ))}
            </div>
            <p style={{ marginTop: 24, color: "var(--muted)" }} data-reveal>
              {tr(l, { pl: "Modele i ceny: zapytaj w salonie albo napisz na ", en: "Models and prices: ask in the venue or email " })}
              <a href={`mailto:${SITE.email}`} style={{ color: "#fff" }}>{SITE.email}</a>
              {SITE.phone ? ` · ${SITE.phone}` : ""}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} data-reveal>
            {["/img/ig/tirenders-4.jpg", "/img/ig/tirenders-10.jpg", "/img/ig/tirenders-3.jpg", "/img/ig/tirenders-9.jpg"].map((src) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 16 }} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="himera">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">Himera × Tirenders</p>
            <Split className="sec-title" text={tr(l, { pl: "Merch Himery na otwarciu.", en: "Himera merch at the opening." })} />
            <p className="sec-lead">
              {tr(l, {
                pl: "Na otwarciu salonu kupisz u nas merch Himery. Sprzedaż tylko stacjonarnie. Online znajdziesz go na ",
                en: "At the venue opening you can buy Himera merch from us. In-store only. Online it's on ",
              })}
              <a href={SITE.himeraShop} target="_blank" rel="noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>himeradrop.com</a>.
            </p>
          </div>
          <PhotoGallery photos={HIMERA_PHOTOS} label="Himera" />
          <div style={{ marginTop: 40 }}>
            <Link href="/rezerwacja" className="btn-white">{tr(l, { pl: "Wpadnij na przejazd", en: "Come for a drive" })}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
