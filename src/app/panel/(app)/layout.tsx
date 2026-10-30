import { redirect } from "next/navigation";
import PanelShell, { type NavGroup } from "@/components/panel/PanelShell";
import { canSee, currentUser, PANEL_ROLES, ROLE_LABEL, type Area } from "@/lib/auth";
import "../panel.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel", robots: { index: false, follow: false } };

const NAV: { title: string; items: [string, string, Area][] }[] = [
  { title: "Przegląd", items: [["/panel", "Pulpit", "dashboard"], ["/panel/strona", "Strona i odwiedziny", "site"]] },
  {
    title: "Salon",
    items: [
      ["/panel/recepcja", "Recepcja: dziś", "reception"],
      ["/panel/kalendarz", "Kalendarz", "calendar"],
      ["/panel/telefon", "Rezerwacja telefoniczna", "calendar"],
      ["/panel/sprzedaz", "Sprzedaż sklep", "sales"],
      ["/panel/wydruk", "Wydruk dnia", "reception"],
    ],
  },
  {
    title: "Biznes",
    items: [
      ["/panel/symulatory", "Symulatory", "sims"],
      ["/panel/klienci", "Klienci", "customers"],
      ["/panel/finanse", "Finanse", "finance"],
      ["/panel/raporty", "Raporty Excel", "reports"],
      ["/panel/kody", "Kody rabatowe", "codes"],
    ],
  },
  { title: "Ustawienia", items: [["/panel/uzytkownicy", "Zespół", "users"], ["/panel/historia", "Historia zmian", "logs"], ["/panel/technika", "Technika", "tech"]] },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const u = await currentUser();
  if (!u) redirect("/panel/logowanie");
  if (!(PANEL_ROLES as readonly string[]).includes(u.role)) redirect("/panel/logowanie?error=role");
  const groups: NavGroup[] = NAV.map((g) => ({ title: g.title, items: g.items.filter(([, , a]) => canSee(u, a)).map(([h, l]) => [h, l] as [string, string]) })).filter((g) => g.items.length);
  return (
    <PanelShell groups={groups} email={u.email} role={ROLE_LABEL[u.role] ?? u.role}>
      {children}
    </PanelShell>
  );
}
