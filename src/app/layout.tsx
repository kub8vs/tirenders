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
