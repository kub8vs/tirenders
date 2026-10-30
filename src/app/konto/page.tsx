import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileForm from "@/components/account/ProfileForm";
import SignOut from "@/components/account/SignOut";
import { simById } from "@/config/site";
import { currentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLang, tr } from "@/lib/i18n";
import { pln } from "@/lib/pricing";
import { fmtLong } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Twoje konto" };

const STATUS = {
  pl: { PAID: "Opłacona", COMPLETED: "Zrealizowana", CANCELLED: "Odwołana", REFUNDED: "Zwrócona", NO_SHOW: "Nieobecność" },
  en: { PAID: "Paid", COMPLETED: "Completed", CANCELLED: "Cancelled", REFUNDED: "Refunded", NO_SHOW: "No-show" },
} as const;

export default async function Page() {
  const u = await currentUser();
  if (!u) redirect("/konto/logowanie?next=/konto");
  const l = getLang();
  const all = await prisma.booking.findMany({
    where: { OR: [{ userId: u.id }, { email: u.email }], status: { in: ["PAID", "COMPLETED", "CANCELLED", "REFUNDED", "NO_SHOW"] } },
    orderBy: { start: "desc" },
  });
  const now = new Date();
  const upcoming = all.filter((b) => b.status === "PAID" && b.end > now).reverse();
  const past = all.filter((b) => !(b.status === "PAID" && b.end > now));
  const done = all.filter((b) => b.status === "COMPLETED");
  const minutes = done.reduce((s, b) => s + b.durationMin, 0);
  const fav = Object.entries(done.reduce<Record<string, number>>((m, b) => ((m[b.simulatorId] = (m[b.simulatorId] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1])[0]?.[0];
  const staff = ["OWNER", "STAFF", "ACCOUNTING"].includes(u.role);

  const Row = ({ b }: { b: (typeof all)[number] }) => (
    <Link href={`/rezerwacja/zarzadzaj?c=${b.code}`} className="acc-row">
      <span>
        <b>{fmtLong(b.start, l)}</b>
        <small>
          {simById(b.simulatorId)?.name} · {b.durationMin} min · {b.code}
        </small>
      </span>
      <span>
        {pln(b.priceGross, l)}
        <small>{STATUS[l][b.status as keyof (typeof STATUS)["pl"]]}</small>
      </span>
    </Link>
  );

  return (
    <div className="wrap" style={{ paddingTop: "clamp(130px, 13vw, 180px)", paddingBottom: 120 }}>
      <div className="sec-head" style={{ marginBottom: 50 }}>
        <p className="eyebrow">{tr(l, { pl: "Twoje konto", en: "Your account" })}</p>
        <h1 className="sec-title">{tr(l, { pl: `Cześć${u.name ? ", " + u.name.split(" ")[0] : ""}.`, en: `Hi${u.name ? ", " + u.name.split(" ")[0] : ""}.` })}</h1>
      </div>

      <div className="stats" style={{ marginTop: 0, marginBottom: 60 }}>
        <div className="stat glass">
          <b>{done.length}</b>
          <span>{tr(l, { pl: "zrealizowanych sesji", en: "completed sessions" })}</span>
        </div>
        <div className="stat glass">
          <b>{minutes}</b>
          <span>{tr(l, { pl: "minut na torze", en: "minutes on track" })}</span>
        </div>
        <div className="stat glass">
          <b style={{ fontSize: "clamp(30px, 3.4vw, 52px)" }}>{fav ? simById(fav)?.name : "—"}</b>
          <span>{tr(l, { pl: "ulubione stanowisko", en: "favourite rig" })}</span>
        </div>
      </div>

      <div className="acc-grid">
        <section>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 18 }}>
            <h2 style={{ fontSize: 28 }}>{tr(l, { pl: "Nadchodzące", en: "Upcoming" })}</h2>
            <Link href="/rezerwacja" className="btn-white" style={{ height: 44 }}>
              {tr(l, { pl: "Nowa rezerwacja", en: "New booking" })}
            </Link>
          </div>
          {upcoming.length ? upcoming.map((b) => <Row key={b.id} b={b} />) : <p className="acc-empty">{tr(l, { pl: "Nic zaplanowanego. Czas to zmienić.", en: "Nothing planned. Time to change that." })}</p>}
          <h2 style={{ fontSize: 28, margin: "50px 0 18px" }}>{tr(l, { pl: "Historia", en: "History" })}</h2>
          {past.length ? past.map((b) => <Row key={b.id} b={b} />) : <p className="acc-empty">{tr(l, { pl: "Tu pojawią się Twoje przejazdy.", en: "Your sessions will show up here." })}</p>}
        </section>
        <aside style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <div className="glass" style={{ padding: 22, display: "grid", gap: 16 }}>
            <h3 style={{ fontSize: 20 }}>{tr(l, { pl: "Dane", en: "Details" })}</h3>
            <p style={{ color: "var(--muted)", fontSize: 14 }}>{u.email}</p>
            <ProfileForm lang={l} name={u.name ?? ""} phone={u.phone ?? ""} />
          </div>
          {staff && (
            <Link href="/panel" className="btn-ghost" style={{ height: 50 }}>
              {tr(l, { pl: "Panel obsługi", en: "Staff panel" })} →
            </Link>
          )}
          <SignOut label={tr(l, { pl: "Wyloguj się", en: "Sign out" })} />
        </aside>
      </div>
      <style>{`
        .acc-grid { display: grid; grid-template-columns: minmax(0,1fr) 340px; gap: clamp(24px, 4vw, 64px); }
        .acc-row { display: flex; justify-content: space-between; gap: 20px; padding: 18px 0; border-bottom: 1px solid var(--line); transition: padding .25s; }
        .acc-row:hover { padding-left: 8px; }
        .acc-row span { display: grid; gap: 4px; }
        .acc-row span:last-child { text-align: right; font-variant-numeric: tabular-nums; }
        .acc-row b { font-weight: 500; }
        .acc-row small { color: var(--muted); font-size: 13px; }
        .acc-empty { color: var(--muted); padding: 18px 0; border-bottom: 1px solid var(--line); }
        @media (max-width: 900px) { .acc-grid { grid-template-columns: minmax(0,1fr); } }
      `}</style>
    </div>
  );
}
