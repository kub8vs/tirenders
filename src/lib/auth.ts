import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

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
      if (!t || t.usedAt || t.expiresAt < new Date()) return null;
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
        const u = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
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

export const ADMIN_ACCESS: Record<string, Role[]> = {
  calendar: ["OWNER", "STAFF"],
  checkin: ["OWNER", "STAFF"],
  sales: ["OWNER", "STAFF"],
  reports: ["OWNER", "ACCOUNTING"],
  codes: ["OWNER"],
  users: ["OWNER"],
  logs: ["OWNER"],
};

export async function staffUser(area: keyof typeof ADMIN_ACCESS) {
  const u = await currentUser();
  if (!u || !ADMIN_ACCESS[area].includes(u.role as Role)) return null;
  return u;
}
