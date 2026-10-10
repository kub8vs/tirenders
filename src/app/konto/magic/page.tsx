import MagicSignIn from "@/components/account/MagicSignIn";

export const metadata = { title: "Logowanie", robots: { index: false } };

export default function Page({ searchParams }: { searchParams: { token?: string; next?: string } }) {
  const next = searchParams.next?.startsWith("/") && !searchParams.next.startsWith("//") ? searchParams.next : "/konto";
  return (
    <div className="wrap page-hero" style={{ minHeight: "70vh" }}>
      <MagicSignIn token={searchParams.token ?? ""} next={next} />
    </div>
  );
}
