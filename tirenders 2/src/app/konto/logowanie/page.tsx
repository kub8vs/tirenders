import { redirect } from "next/navigation";
import AuthForm from "@/components/account/AuthForm";
import { currentUser, oauthEnabled } from "@/lib/auth";
import { getLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata = { title: "Logowanie" };

export default async function Page({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/konto";
  if (await currentUser()) redirect(next);
  return (
    <div className="wrap page-hero" style={{ maxWidth: 560, minHeight: "90vh" }}>
      <AuthForm lang={getLang()} next={next} google={oauthEnabled.google} apple={oauthEnabled.apple} error={searchParams.error} />
    </div>
  );
}
