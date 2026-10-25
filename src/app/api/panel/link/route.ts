import { NextResponse } from "next/server";
import { z } from "zod";
import { PANEL_ROLES } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPasswordLink } from "@/lib/panelAuth";
import { allow, clientIp } from "@/lib/ratelimit";

const Body = z.object({ email: z.string().email().max(160) });

// Zawsze ta sama odpowiedź, żeby nie dało się sprawdzić, kto ma konto w panelu.
export async function POST(req: Request) {
  if (!(await allow(`pwlink:ip:${clientIp(req)}`, 10, 900))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = p.data.email.trim().toLowerCase();
  if (!(await allow(`pwlink:${email}`, 3, 900))) return NextResponse.json({ error: "rate" }, { status: 429 });
  const u = await prisma.user.findUnique({ where: { email } });
  let dev: string | undefined;
  if (u && (PANEL_ROLES as readonly string[]).includes(u.role)) {
    const url = await sendPasswordLink(email, false);
    if (!process.env.RESEND_API_KEY && process.env.NODE_ENV !== "production") dev = url;
  }
  return NextResponse.json({ ok: true, dev });
}
