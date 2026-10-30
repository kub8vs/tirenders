// Odwiedziny strony z Vercel Web Analytics (te same dane co w zakładce Analytics na vercel.com).
// Wymaga tokenu VERCEL_API_TOKEN (Vercel → Account Settings → Tokens, zakres: zespół projektu).
const PROJECT = process.env.VERCEL_ANALYTICS_PROJECT || "prj_b6A2CUsFFX9YdUcZ934Dc0xgIzkk";
const TEAM = process.env.VERCEL_ANALYTICS_TEAM || "team_3Sw7A7xA9k1q4ErO5SRCqvXt";

export const analyticsReady = () => !!process.env.VERCEL_API_TOKEN;

type Row = Record<string, string | number> & { visitors: number; pageviews: number };

/** by: np. ["day"], ["referrerHostname"], ["deviceType"], ["requestPath"]. null = brak tokenu albo błąd. */
export async function visits(by: string[], since: Date, until: Date, limit = 10): Promise<Row[] | null> {
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return null;
  const q = new URLSearchParams({ projectId: PROJECT, teamId: TEAM, since: since.toISOString(), until: until.toISOString(), limit: String(limit) });
  for (const b of by) q.append("by", b);
  try {
    const r = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const d = (await r.json()) as { data?: Row[] };
    return d.data ?? [];
  } catch {
    return null;
  }
}

export const sum = (rows: Row[] | null, k: "visitors" | "pageviews") => (rows ?? []).reduce((s, x) => s + (Number(x[k]) || 0), 0);
