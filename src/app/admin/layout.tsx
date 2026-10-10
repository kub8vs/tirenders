import Link from "next/link";
import { redirect } from "next/navigation";
import { ADMIN_ACCESS, currentUser, type Role } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel obsługi", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  if (!u) redirect("/konto/logowanie?next=/admin");
  if (!["OWNER", "STAFF", "ACCOUNTING"].includes(u.role)) redirect("/konto");
  const role = u.role as Role;
  const items = [
    ["/admin", "Kalendarz", "calendar"],
    ["/admin/checkin", "Check-in", "checkin"],
    ["/admin/sprzedaz", "Sprzedaż sklep", "sales"],
    ["/admin/raporty", "Raporty Excel", "reports"],
    ["/admin/kody", "Kody rabatowe", "codes"],
    ["/admin/uzytkownicy", "Zespół", "users"],
    ["/admin/powiadomienia", "Powiadomienia", "logs"],
  ].filter(([, , a]) => ADMIN_ACCESS[a].includes(role)) as [string, string, string][];
  return (
    <div className="adm">
      <aside className="adm-side">
        <Link href="/" className="adm-brand">TIRENDERS<small>panel obsługi</small></Link>
        <AdminNav items={items.map(([h, l]) => [h, l])} />
        <div className="adm-me">
          {u.email}
          <small>{{ OWNER: "Właściciel", STAFF: "Obsługa", ACCOUNTING: "Księgowość" }[role as "OWNER"]}</small>
        </div>
      </aside>
      <div className="adm-main">{children}</div>
      <style>{`
        .adm { display: grid; grid-template-columns: 230px minmax(0,1fr); min-height: 100vh; }
        .adm-side { border-right: 1px solid var(--line); padding: 26px 16px; display: flex; flex-direction: column; gap: 30px; position: sticky; top: 0; height: 100vh; }
        .adm-brand { font-weight: 600; letter-spacing: .26em; font-size: 13px; display: grid; gap: 4px; padding: 0 10px; }
        .adm-brand small { letter-spacing: .1em; color: var(--muted); font-weight: 400; font-size: 11px; text-transform: uppercase; }
        .adm-me { margin-top: auto; font-size: 12.5px; color: #bbb; display: grid; gap: 2px; padding: 0 10px; word-break: break-all; }
        .adm-me small { color: var(--muted); }
        .adm-main { padding: 34px clamp(16px, 3vw, 44px) 80px; min-width: 0; }
        .adm h1 { font-size: 34px; margin-bottom: 24px; }
        .adm table { border-collapse: collapse; width: 100%; font-size: 14px; font-variant-numeric: tabular-nums; }
        .adm th, .adm td { text-align: left; padding: 10px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
        .adm th { font-weight: 500; color: var(--muted); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
        .pill { display: inline-block; padding: 3px 9px; border-radius: 999px; font-size: 11.5px; border: 1px solid var(--line-2); }
        .pill.PAID { border-color: rgba(61,220,132,.5); color: #9ff0c0; }
        .pill.COMPLETED { background: rgba(61,220,132,.15); color: #9ff0c0; }
        .pill.PENDING { border-color: rgba(255,200,0,.5); color: #ffe08a; }
        .pill.CANCELLED, .pill.REFUNDED, .pill.EXPIRED, .pill.NO_SHOW { color: #ff9a9a; border-color: rgba(255,42,42,.4); }
        @media (max-width: 860px) { .adm { grid-template-columns: minmax(0,1fr); } .adm-side { position: static; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 12px; } .adm-me { display: none; } }
      `}</style>
    </div>
  );
}
