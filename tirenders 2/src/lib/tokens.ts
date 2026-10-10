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

export function manageUrl(code: string) {
  const base = (process.env.APP_URL || "http://localhost:3100").replace(/\/$/, "");
  return `${base}/rezerwacja/zarzadzaj?c=${code}&s=${sign("manage:" + code)}`;
}

const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export function bookingCode() {
  const bytes = crypto.randomBytes(6);
  return Array.from(bytes, (x) => ALPHA[x % ALPHA.length]).join("");
}

export function randomToken() {
  return crypto.randomBytes(24).toString("base64url");
}
