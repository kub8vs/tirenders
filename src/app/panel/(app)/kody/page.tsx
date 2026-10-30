import { redirect } from "next/navigation";
import CodesAdmin from "@/components/panel/CodesAdmin";
import { staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function Page() {
  if (!(await staffUser("codes"))) redirect("/panel");
  const codes = await prisma.discountCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <h1>Kody rabatowe</h1>
      <CodesAdmin codes={codes.map((c) => ({ code: c.code, percent: c.percent, amountOff: c.amountOff, uses: c.uses, maxUses: c.maxUses, validTo: c.validTo?.toISOString().slice(0, 10) ?? null, active: c.active }))} />
    </>
  );
}
