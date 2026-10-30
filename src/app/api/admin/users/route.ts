import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { PANEL_ROLES, ROLE_LABEL, staffUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPasswordLink } from "@/lib/panelAuth";

const Body = z.object({
  email: z.string().email(),
  role: z.enum(["CUSTOMER", "STAFF", "ACCOUNTING", "OWNER"]).optional(),
  name: z.string().trim().max(120).optional(),
  sendLink: z.boolean().optional(),
});

// Zespół: nadanie roli wysyła zaproszenie z linkiem do ustawienia hasła.
export async function POST(req: Request) {
  const me = await staffUser("users");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const email = p.data.email.trim().toLowerCase();
  const isPanel = (r: string) => (PANEL_ROLES as readonly string[]).includes(r);

  if (p.data.sendLink) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u || !isPanel(u.role)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    await sendPasswordLink(email, !u.passwordHash);
    await audit(me.email, "Wysłanie linku do hasła", { details: email });
    return NextResponse.json({ ok: true });
  }

  const role = p.data.role;
  if (!role) return NextResponse.json({ error: "invalid" }, { status: 400 });
  if (email === me.email && role !== "OWNER") return NextResponse.json({ error: "self" }, { status: 400 });
  const before = await prisma.user.findUnique({ where: { email } });
  const u = await prisma.user.upsert({
    where: { email },
    update: { role, ...(p.data.name ? { name: p.data.name } : {}) },
    create: { email, role, name: p.data.name || null },
  });
  // Nowa osoba w zespole (albo awans z konta gościa) dostaje zaproszenie mailem.
  if (isPanel(role) && (!before || !isPanel(before.role))) await sendPasswordLink(email, true);
  await audit(me.email, isPanel(role) ? `Rola: ${ROLE_LABEL[role]}` : "Odebranie dostępu do panelu", { details: email });
  return NextResponse.json({ ok: true, id: u.id });
}
