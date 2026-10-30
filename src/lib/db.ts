import { PrismaClient } from "@prisma/client";

const g = globalThis as unknown as { prisma?: PrismaClient };
// Na otwarciu jedna funkcja Vercel obsługuje wiele osób naraz: większa pula połączeń (Neon ma pooler)
// i dłuższe czekanie na wolne połączenie zamiast błędu po 10 s.
function url() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const u = new URL(raw);
  if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "20");
  if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
  return u.toString();
}
export const prisma = g.prisma ?? new PrismaClient({ datasourceUrl: url() });
if (process.env.NODE_ENV !== "production") g.prisma = prisma;
