import { redirect } from "next/navigation";
import { Bars, HBars } from "@/components/panel/Charts";
import PeriodTabs, { periodOf } from "@/components/panel/PeriodTabs";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { lastDays } from "@/lib/stats";
import { addDays, todayWarsaw, warsaw } from "@/lib/time";
import { analyticsReady, sum, visits } from "@/lib/vercelAnalytics";

export const dynamic = "force-dynamic";

const DEVICE: Record<string, string> = { mobile: "Telefon", desktop: "Komputer", tablet: "Tablet" };
const PAGE: Record<string, string> = { "/": "Strona główna", "/rezerwacja": "Rezerwacja", "/oferta": "Oferta", "/cennik": "Cennik", "/faq": "FAQ", "/o-nas": "O nas", "/regulamin": "Regulamin", "/sklep": "Sklep" };

export default async function Page({ searchParams }: { searchParams: { p?: string } }) {
  if (!(await staffUser("site"))) redirect("/panel");
  const days = periodOf(searchParams.p);
  if (!analyticsReady())
    return (
      <>
        <h1>Strona i odwiedziny</h1>
        <div className="glass panel-box" style={{ maxWidth: 680, display: "grid", gap: 10 }}>
          <b style={{ fontWeight: 500 }}>Potrzebny jeden klucz z Vercela</b>
          <p className="muted">Statystyki odwiedzin zbiera Vercel. Żeby pokazać je tutaj, właściciel strony dodaje raz token:</p>
          <ol style={{ paddingLeft: 20, display: "grid", gap: 6 }}>
            <li>vercel.com → zdjęcie profilowe → Account Settings → Tokens → Create.</li>
            <li>Nazwa „panel-tirenders”, zakres: zespół kubzxcs-projects, ważność: bez końca.</li>
            <li>W projekcie: Settings → Environment Variables → VERCEL_API_TOKEN (Production, zaznacz Sensitive).</li>
          </ol>
        </div>
      </>
    );
  const until = new Date();
  const since = warsaw(addDays(todayWarsaw(), -(days - 1)), "00:00");
  const [daily, refs, devices, pages, todayV, bookings] = await Promise.all([
    visits(["day"], since, until, 100),
    visits(["referrerHostname"], since, until, 8),
    visits(["deviceType"], since, until, 5),
    visits(["requestPath"], since, until, 10),
    visits(["day"], warsaw(todayWarsaw(), "00:00"), until),
    prisma.booking.count({ where: { paidAt: { gte: since }, source: "ONLINE" } }),
  ]);
  const visitors = sum(daily, "visitors");
  const bookingVisitors = Number(pages?.find((p) => p.requestPath === "/rezerwacja")?.visitors ?? 0);
  const r = lastDays(days);
  return (
    <>
      <div className="head">
        <h1>Strona i odwiedziny</h1>
        <PeriodTabs base="/panel/strona" current={days} />
      </div>
      {daily === null && <p className="err" style={{ marginBottom: 16 }}>Vercel nie odpowiedział albo token jest nieprawidłowy. Spróbuj za chwilę.</p>}
      <div className="kpis">
        <div className="kpi glass"><span>Odwiedzający dziś</span><b>{sum(todayV, "visitors")}</b><small>{sum(todayV, "pageviews")} wyświetleń</small></div>
        <div className="kpi glass"><span>Odwiedzający ({days} dni)</span><b>{visitors}</b><small>{sum(daily, "pageviews")} wyświetleń stron</small></div>
        <div className="kpi glass"><span>Otworzyli rezerwację</span><b>{bookingVisitors}</b><small>{visitors ? Math.round((bookingVisitors / visitors) * 100) : 0}% odwiedzających</small></div>
        <div className="kpi glass"><span>Zapłacili online</span><b>{bookings}</b><small>{bookingVisitors ? Math.round((bookings / bookingVisitors) * 100) : 0}% z otwierających rezerwację</small></div>
      </div>
      <h2>Odwiedzający dzień po dniu</h2>
      <Bars title="Unikalni odwiedzający" fmt={(x) => String(x)} data={(daily ?? []).map((d) => { const t = String(d.timestamp ?? ""); return { label: `${t.slice(8, 10)}.${t.slice(5, 7)}`, value: Number(d.visitors) || 0 }; })} />
      <div className="grid-2" style={{ marginTop: 12 }}>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Skąd przychodzą</b>
          <HBars fmt={String} rows={(refs ?? []).map((x) => ({ label: String(x.referrerHostname || "wpisany adres / aplikacja"), value: Number(x.visitors) || 0 }))} />
        </div>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Urządzenia</b>
          <HBars fmt={String} rows={(devices ?? []).map((x) => ({ label: DEVICE[String(x.deviceType)] ?? String(x.deviceType), value: Number(x.visitors) || 0 }))} />
        </div>
        <div className="glass panel-box">
          <b style={{ fontWeight: 500, display: "block", marginBottom: 10 }}>Najczęściej oglądane</b>
          <HBars fmt={String} rows={(pages ?? []).map((x) => ({ label: PAGE[String(x.requestPath)] ?? String(x.requestPath), value: Number(x.pageviews) || 0 }))} />
        </div>
      </div>
      <p className="muted" style={{ marginTop: 16, fontSize: 13 }}>Dane z Vercel Web Analytics, odświeżane co 10 minut, okres {r.from} – {r.to}. Szybkość strony: vercel.com → projekt → Speed Insights.</p>
    </>
  );
}
