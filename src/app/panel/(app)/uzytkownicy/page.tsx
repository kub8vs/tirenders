import { redirect } from "next/navigation";
import TeamAdmin from "@/components/panel/TeamAdmin";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  const me = await staffUser("users");
  if (!me) redirect("/panel");
  const team = await prisma.user.findMany({ where: { role: { not: "CUSTOMER" } }, orderBy: { createdAt: "asc" } });
  return (
    <>
      <h1>Zespół</h1>
      <p className="muted" style={{ marginBottom: 20, maxWidth: "72ch" }}>
        Właściciel widzi wszystko. Recepcja widzi tylko dzisiejszych gości, kalendarz, rezerwacje telefoniczne i sprzedaż, bez przychodów. Księgowość widzi tylko raporty Excel.
        Po dodaniu osoba dostaje maila z linkiem do ustawienia hasła i loguje się na tirenders.pl/panel.
      </p>
      <TeamAdmin me={me.email} team={team.map((u) => ({ email: u.email, name: u.name, role: u.role, hasPassword: !!u.passwordHash }))} />
    </>
  );
}
