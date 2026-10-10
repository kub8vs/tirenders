import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/notify";
import { appUrl, magicEmail } from "@/lib/templates";
import { randomToken } from "@/lib/tokens";

const Body = z.object({ email: z.string().email().max(160), lang: z.enum(["pl", "en"]).default("pl"), next: z.string().max(200).optional() });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  // max 5 linków na 15 minut na adres
  const recent = await prisma.magicToken.count({ where: { email, createdAt: { gt: new Date(Date.now() - 15 * 60_000) } } });
  if (recent >= 5) return NextResponse.json({ error: "rate" }, { status: 429 });
  const token = randomToken();
  await prisma.magicToken.create({ data: { token, email, expiresAt: new Date(Date.now() + 20 * 60_000) } });
  const next = parsed.data.next?.startsWith("/") && !parsed.data.next.startsWith("//") ? parsed.data.next : "/konto";
  const url = `${appUrl()}/konto/magic?token=${token}&next=${encodeURIComponent(next)}`;
  const m = magicEmail(url, parsed.data.lang);
  await sendEmail({ to: email, subject: m.subject, html: m.html });
  return NextResponse.json({ ok: true, dev: !process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production" ? url : undefined });
}
