import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";
import { allow } from "./ratelimit";

export type Role = "CUSTOMER" | "STAFF" | "ACCOUNTING" | "OWNER";

async function linkGuestBookings(userId: string, email: string) {
  await prisma.booking.updateMany({ where: { email, userId: null }, data: { userId } });
}

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    id: "password",
    name: "E-mail i hasło",
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(c) {
      const email = c?.email?.trim().toLowerCase();
      if (!email || !c?.password) return null;
      // Max 5 prób logowania na adres w 15 minut (chroni panel przed zgadywaniem hasła).
      if (!(await allow(`login:${email}`, 5, 900))) throw new Error("rate");
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.passwordHash || !(await bcrypt.compare(c.password, user.passwordHash))) return null;
      await linkGuestBookings(user.id, email);
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
  CredentialsProvider({
    id: "magic",
    name: "Link na e-mail",
    credentials: { token: { type: "text" } },
    async authorize(c) {
      if (!c?.token) return null;
      const t = await prisma.magicToken.findUnique({ where: { token: c.token } });
      if (!t || t.purpose !== "login" || t.usedAt || t.expiresAt < new Date()) return null;
      await prisma.magicToken.update({ where: { token: t.token }, data: { usedAt: new Date() } });
      const user = await prisma.user.upsert({ where: { email: t.email }, update: {}, create: { email: t.email } });
      await linkGuestBookings(user.id, user.email);
      return { id: user.id, email: user.email, name: user.name };
    },
  }),
];
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  providers.push(GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET }));
if (process.env.APPLE_ID && process.env.APPLE_SECRET) providers.push(AppleProvider({ clientId: process.env.APPLE_ID, clientSecret: process.env.APPLE_SECRET }));

export const oauthEnabled = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  apple: !!(process.env.APPLE_ID && process.env.APPLE_SECRET),
};

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "dev-secret-change-me",
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: "/konto/logowanie" },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (account && (account.provider === "google" || account.provider === "apple")) {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const u = await prisma.user.upsert({ where: { email }, update: {}, create: { email, name: user.name ?? null } });
        await linkGuestBookings(u.id, email);
        user.id = u.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        let u = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        // Adresy z OWNER_EMAILS (zmienna w Vercel, po przecinku) dostają rolę właściciela przy logowaniu,
        // żeby nowa baza nie wymagała ręcznego zakładania konta admina.
        const owners = (process.env.OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
        if (u && u.role !== "OWNER" && owners.includes(u.email)) u = await prisma.user.update({ where: { id: u.id }, data: { role: "OWNER" } });
        if (u) {
          token.uid = u.id;
          token.role = u.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.uid as string;
        (session.user as { role?: string }).role = (token.role as string) ?? "CUSTOMER";
      }
      return session;
    },
  },
};

export async function currentUser() {
  const s = await getServerSession(authOptions);
  const id = (s?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  return prisma.user.findUnique({ where: { id } });
}

export const PANEL_ROLES = ["OWNER", "STAFF", "ACCOUNTING"] as const;
export const ROLE_LABEL: Record<string, string> = { OWNER: "Właściciel", STAFF: "Recepcja", ACCOUNTING: "Księgowość", CUSTOMER: "Gość" };

// Kto widzi którą część panelu. Recepcja nie widzi pieniędzy, księgowość tylko raporty.
export const ADMIN_ACCESS = {
  dashboard: ["OWNER"],
  reception: ["OWNER", "STAFF"],
  calendar: ["OWNER", "STAFF"],
  checkin: ["OWNER", "STAFF"],
  sales: ["OWNER", "STAFF"],
  refunds: ["OWNER"],
  sims: ["OWNER"],
  service: ["OWNER", "STAFF"], // wyłączenie stanowiska na serwis (recepcja też, bo jest na miejscu)
  site: ["OWNER"],
  customers: ["OWNER"],
  finance: ["OWNER"],
  reports: ["OWNER", "ACCOUNTING"],
  codes: ["OWNER"],
  users: ["OWNER"],
  logs: ["OWNER"],
  tech: ["OWNER"],
} satisfies Record<string, Role[]>;
export type Area = keyof typeof ADMIN_ACCESS;

/** Konta z OWNER_EMAILS (twórca strony) widzą dodatkowo zakładkę Technika. */
export const isSuperOwner = (email: string) =>
  (process.env.OWNER_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());

export const canSee = (u: { role: string; email: string }, area: Area) =>
  (ADMIN_ACCESS[area] as readonly string[]).includes(u.role) && (area !== "tech" || isSuperOwner(u.email));

export async function staffUser(area: Area) {
  const u = await currentUser();
  if (!u || !canSee(u, area)) return null;
  return u;
}

/** Strona startowa panelu dla danej roli. */
export const panelHome = (role: string) => (role === "OWNER" ? "/panel" : role === "STAFF" ? "/panel/recepcja" : "/panel/raporty");
