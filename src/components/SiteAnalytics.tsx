"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

// Wejścia zespołu do panelu nie liczą się jako odwiedziny strony.
const isPanel = (url: string) => new URL(url, "https://x").pathname.startsWith("/panel");

export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={(e) => (isPanel(e.url) ? null : e)} />
      <SpeedInsights beforeSend={(e) => (isPanel(e.url) ? null : e)} />
    </>
  );
}
