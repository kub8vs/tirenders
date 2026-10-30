import type { Metadata, Viewport } from "next";
import { Inter, Racing_Sans_One } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import Motion from "@/components/Motion";
import Reveal from "@/components/Reveal";
import SiteAnalytics from "@/components/SiteAnalytics";
import { getDict, getLang } from "@/lib/i18n";
import { siteUrl } from "@/lib/tokens";

// Dopóki Stripe klienta nie jest podpięty, pełna strona działa na płatnościach testowych: mówimy to wprost.
const testMode = () => process.env.VERCEL_ENV === "production" && !(process.env.STRIPE_SECRET_KEY ?? "").includes("_live_");
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const race = Racing_Sans_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-race", display: "swap" });

export function generateMetadata(): Metadata {
  const d = getDict();
  return {
    title: { default: d.meta.title, template: `%s · Tirenders` },
    description: d.meta.description,
    metadataBase: new URL(siteUrl()),
    openGraph: { title: d.meta.title, description: d.meta.description, images: ["/img/foto/og.jpg"], type: "website" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const d = getDict();
  return (
    <html lang={lang} className={`${inter.variable} ${race.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');if(location.pathname==='/')document.documentElement.dataset.intro='on'" }} />
      </head>
      <body>
        <div className="bg-fx" aria-hidden="true">
          <svg className="bg-track" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
            <path d="M-50 640 C 220 560 260 300 520 300 S 820 520 1000 420 1180 160 1300 120" />
            <path d="M-50 700 C 240 620 300 360 540 360 S 840 580 1020 480 1200 220 1300 180" />
          </svg>
        </div>
        {testMode() && (
          <div role="note" className="no-print" style={{ position: "fixed", zIndex: 60, left: 0, right: 0, bottom: 0, background: "#ff2a2a", color: "#fff", textAlign: "center", fontSize: 12.5, lineHeight: 1.4, padding: "6px 16px calc(6px + env(safe-area-inset-bottom, 0px))", pointerEvents: "none" }}>
            {lang === "en" ? "Test version: payments are test-only, no money is charged. Opening 14.11." : "Wersja testowa: płatności są testowe, nie pobieramy pieniędzy. Otwarcie 14.11."}
          </div>
        )}
        <Providers>
          <Header t={d} lang={lang} />
          <main>{children}</main>
          <Footer t={d} />
          <Reveal />
          <Motion />
        </Providers>
        <SiteAnalytics />
      </body>
    </html>
  );
}
