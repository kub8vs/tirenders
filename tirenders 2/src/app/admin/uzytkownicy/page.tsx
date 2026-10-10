import { redirect } from "next/navigation";
import TeamAdmin from "@/components/admin/TeamAdmin";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  if (!(await staffUser("users"))) redirect("/admin");
  const team = await prisma.user.findMany({ where: { role: { not: "CUSTOMER" } }, orderBy: { createdAt: "asc" } });
  const customers = await prisma.user.count({ where: { role: "CUSTOMER" } });
  return (
    <>
      <h1>Zespół</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20, maxWidth: "70ch" }}>
        Obsługa widzi kalendarz, check-in i sprzedaż. Księgowość tylko raporty. Właściciel wszystko. Nadaj rolę po adresie e-mail, a osoba zaloguje się linkiem na e-mail. Klientów z kontem: {customers}.
      </p>
      <TeamAdmin team={team.map((u) => ({ email: u.email, name: u.name, role: u.role }))} />
    </>
  );
}
