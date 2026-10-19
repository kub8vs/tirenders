import crypto from "crypto";

const secret = () => process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

export function sign(value: string) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url").slice(0, 22);
}

export function verify(value: string, sig: string | null | undefined) {
  if (!sig) return false;
  const a = Buffer.from(sign(value));
  const b = Buffer.from(sig);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Adres strony do linków w mailach i SMS-ach. Kopia testowa linkuje do siebie, nie do produkcji. */
export function siteUrl() {
  const e = process.env;
  const host = e.VERCEL_ENV === "preview" && e.VERCEL_BRANCH_URL ? `https://${e.VERCEL_BRANCH_URL}` : e.APP_URL || (e.VERCEL_PROJECT_PRODUCTION_URL ? `https://${e.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3100");
  return host.replace(/\/$/, "");
}

export function manageUrl(code: string) {
  const base = siteUrl();
  return `${base}/rezerwacja/zarzadzaj?c=${code}&s=${sign("manage:" + code)}`;
}

/** Krótki link do zapłaty wysyłany SMS-em przy rezerwacji telefonicznej. */
export function payUrl(code: string) {
  const base = siteUrl();
  return `${base}/zaplac/${code}?s=${sign("pay:" + code)}`;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function bookingCode() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (x) => ALPHA[x % ALPHA.length]).join("");
}

export function randomToken() {
  return crypto.randomBytes(24).toString("base64url");
}
