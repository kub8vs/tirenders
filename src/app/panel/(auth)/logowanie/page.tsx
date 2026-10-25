import { redirect } from "next/navigation";
import PanelLogin from "@/components/panel/PanelLogin";
import { currentUser, PANEL_ROLES, panelHome } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: { error?: string } }) {
  const u = await currentUser();
  if (u && (PANEL_ROLES as readonly string[]).includes(u.role)) redirect(panelHome(u.role));
  return <PanelLogin wrongAccount={!!u} />;
}
