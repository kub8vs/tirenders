import SetPassword from "@/components/panel/SetPassword";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { token?: string } }) {
  const t = searchParams.token ? await prisma.magicToken.findUnique({ where: { token: searchParams.token } }) : null;
  const valid = !!t && t.purpose === "password" && !t.usedAt && t.expiresAt > new Date();
  return <SetPassword token={valid ? t!.token : null} email={valid ? t!.email : null} />;
}
