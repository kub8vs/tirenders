import "../panel.css";

export const metadata = { title: "Logowanie do panelu", robots: { index: false, follow: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <div style={{ width: "min(420px, 100%)", display: "grid", gap: 26 }}>
        <img src="/img/2real-logo.webp" alt="2Real Simracing by Tirenders" width={1109} height={384} style={{ width: 200, height: "auto", justifySelf: "center" }} />
        {children}
      </div>
    </div>
  );
}
