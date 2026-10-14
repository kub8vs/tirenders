import Cta from "@/components/Cta";
import Rich from "@/components/Rich";
import Split from "@/components/Split";
import { SITE } from "@/config/site";
import PhotoGallery from "@/components/shop/PhotoGallery";
import { HIMERA_PHOTOS } from "@/content/himera";
import { getLang, tr } from "@/lib/i18n";

export const metadata = { title: "Sklep: kierownice i merch Himery" };

export default function Page() {
  const l = getLang();
  const wheelPoints = [
    { pl: ["Z prawdziwych aut", "Oryginalna kierownica przerobiona do sim racingu. *Ten sam chwyt, ta sama skóra.*"], en: ["From real cars", "An original car wheel converted for sim racing. *Same grip, same leather.*"] },
    { pl: ["Przetestuj, zanim kupisz", "Każdą sprawdzisz na naszych stanowiskach. *Wystarczy powiedzieć obsłudze.*"], en: ["Try before you buy", "Test any of them on our rigs. *Just ask the staff.*"] },
    { pl: ["Kupujesz na miejscu", "W salonie w Warszawie. Doradzimy, z jaką bazą zadziała i *jak ją zamontować.*"], en: ["Buy in the venue", "In our Warsaw venue. We'll tell you which wheelbase fits and *how to mount it.*"] },
  ];
  return (
    <>
      <div className="wrap page-hero">
        <p className="eyebrow">{tr(l, { pl: "Sklep w salonie", en: "In-store shop" })}</p>
        <Split as="h1" text={tr(l, { pl: "Kierownice *i merch.*", en: "Wheels *and merch.*" })} />
        <p>
          <Rich text={tr(l, { pl: "Wszystko kupisz w salonie w Warszawie. *Bierzesz do ręki, testujesz, zabierasz.*", en: "Everything is sold in our Warsaw venue. *Pick it up, try it, take it home.*" })} />
        </p>
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap split" style={{ alignItems: "start" }}>
          <div>
            <div className="sec-head" data-reveal style={{ marginBottom: 40 }}>
              <p className="eyebrow">{tr(l, { pl: "Kierownice sim racingowe", en: "Sim racing wheels" })}</p>
              <Split className="sec-title" style={{ fontSize: "clamp(36px, 4.6vw, 72px)" }} text={tr(l, { pl: "Kierownica z auta. *Na Twoim biurku.*", en: "A wheel from a car. *On your desk.*" })} />
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {wheelPoints.map((p, i) => (
                <div className="card glass" key={i} data-reveal data-delay={i * 90}>
                  <h3>{p[l][0]}</h3>
                  <p>
                    <Rich text={p[l][1]} />
                  </p>
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
            {["/img/foto/merch-tirenders.webp", "/img/foto/kokpit-symulator.webp", "/img/foto/bluza-tirenders.webp", "/img/foto/silnik-m.webp"].map((src) => (
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
            <Split className="sec-title" text={tr(l, { pl: "Merch Himery *na otwarciu.*", en: "Himera merch *at the opening.*" })} />
            <p className="sec-lead">
              {tr(l, {
                pl: "Tylko stacjonarnie, w salonie. Online znajdziesz go na ",
                en: "In-store only, at the venue. Online it's on ",
              })}
              <a href={SITE.himeraShop} target="_blank" rel="noreferrer" style={{ color: "#fff", textDecoration: "underline" }}>himeradrop.com</a>.
            </p>
          </div>
          <PhotoGallery photos={HIMERA_PHOTOS} label="Himera" />
          <div style={{ marginTop: 40 }}>
            <Cta href="/rezerwacja">{tr(l, { pl: "Wpadnij na przejazd", en: "Come for a drive" })}</Cta>
          </div>
        </div>
      </section>
    </>
  );
}
