import type { Metadata, Viewport } from "next";
import { Inter, Racing_Sans_One } from "next/font/google";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Providers from "@/components/Providers";
import Motion from "@/components/Motion";
import Reveal from "@/components/Reveal";
import { getDict, getLang } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter", display: "swap" });
const race = Racing_Sans_One({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-race", display: "swap" });

export function generateMetadata(): Metadata {
  const d = getDict();
  return {
    title: { default: d.meta.title, template: `%s · Tirenders` },
    description: d.meta.description,
    metadataBase: new URL(process.env.APP_URL || "http://localhost:3100"),
    openGraph: { title: d.meta.title, description: d.meta.description, images: ["/img/ig/tirenders-post-1.jpg"], type: "website" },
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
        <Providers>
          <Header t={d} lang={lang} />
          <main>{children}</main>
          <Footer t={d} />
          <Reveal />
          <Motion />
        </Providers>
      </body>
    </html>
  );
}
