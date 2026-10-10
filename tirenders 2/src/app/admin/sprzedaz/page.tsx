import { redirect } from "next/navigation";
import SaleForm from "@/components/admin/SaleForm";
import { HIMERA } from "@/content/himera";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { pln } from "@/lib/pricing";
import { fmtTime, todayWarsaw, warsaw } from "@/lib/time";

export default async function Page() {
  if (!(await staffUser("sales"))) redirect("/admin");
  const sales = await prisma.sale.findMany({ where: { createdAt: { gte: warsaw(todayWarsaw(), "00:00") } }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <h1>Sprzedaż w salonie</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: "70ch" }}>Wpisuj tu sprzedaż merchu Himery i kierownic na miejscu, żeby trafiła do raportów Excel. Paragon wystawiasz jak zwykle na kasie fiskalnej.</p>
      <SaleForm presets={HIMERA.map((h) => ({ name: h.name.pl, price: h.price }))} />
      <h2 style={{ fontSize: 22, margin: "40px 0 14px" }}>Dzisiaj</h2>
      <table>
        <thead><tr><th>Godzina</th><th>Produkt</th><th>Ilość</th><th>Kwota</th><th>Metoda</th><th>Kto</th></tr></thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}><td>{fmtTime(s.createdAt)}</td><td>{s.product}</td><td>{s.qty}</td><td>{pln(s.amount)}</td><td>{s.method}</td><td>{s.createdBy}</td></tr>
          ))}
          {!sales.length && <tr><td colSpan={6} style={{ color: "var(--muted)" }}>Brak sprzedaży dzisiaj.</td></tr>}
        </tbody>
      </table>
    </>
  );
}
