// Limity zapytań: chronią rezerwacje i logowanie przed botami i zalewem kliknięć przy starcie sprzedaży.
// Liczniki w Upstash Redis (integracja w Vercel ustawia KV_REST_API_URL i KV_REST_API_TOKEN).
// Bez Redisa liczymy w pamięci jednej instancji, a gdy Redis nie odpowiada, przepuszczamy ruch
// (lepiej wpuścić kilka zapytań za dużo, niż zablokować prawdziwych klientów).

const url = () => process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const memory = new Map<string, { n: number; until: number }>();

/** true = można dalej, false = za dużo prób w tym oknie czasu. */
export async function allow(key: string, max: number, windowSec: number) {
  const bucket = `rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  const u = url();
  const t = token();
  if (!u || !t) {
    const now = Date.now();
    const e = memory.get(bucket);
    if (memory.size > 10_000) for (const [k, v] of memory) if (v.until < now) memory.delete(k);
    const n = (e?.n ?? 0) + 1;
    memory.set(bucket, { n, until: now + windowSec * 1000 });
    return n <= max;
  }
  try {
    const res = await fetch(`${u.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      body: JSON.stringify([["INCR", bucket], ["EXPIRE", bucket, String(windowSec)]]),
      signal: AbortSignal.timeout(800),
      cache: "no-store",
    });
    const out = (await res.json()) as { result?: number }[];
    return (out[0]?.result ?? 0) <= max;
  } catch {
    return true;
  }
}

/** Adres IP klienta za CDN Vercel. */
export function clientIp(req: Request) {
  return req.headers.get("x-real-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
