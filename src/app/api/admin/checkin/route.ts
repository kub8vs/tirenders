import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { staffUser } from "@/lib/auth";
import { BookingError, cancelBooking, refundPolicy } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { deskRow } from "@/lib/reception";
import { addDays, todayWarsaw, warsaw } from "@/lib/time";

const Find = z.object({ action: z.literal("find"), q: z.string().trim().min(2).max(80) });
const Ids = z.object({ action: z.enum(["confirm", "noshow", "undo", "cancel"]), ids: z.array(z.string()).min(1).max(10) });
// Korekta ceny na miejscu: nowa cena końcowa w groszach i powód.
const Price = z.object({ action: z.literal("price"), id: z.string(), price: z.number().int().min(0).max(1_000_000), note: z.string().trim().min(2).max(200) });

const cleanCode = (s: string) => s.toUpperCase().replace(/^TIRENDERS:/, "").replace(/[^A-Z0-9]/g, "");

// Recepcja: szukanie gościa po kodzie albo nazwisku i potwierdzanie przyjścia.
export async function POST(req: Request) {
  const me = await staffUser("checkin");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const body = await req.json().catch(() => null);

  if (body?.action === "find") {
    const p = Find.safeParse(body);
    if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const code = cleanCode(p.data.q);
    // Kod: dokładne trafienie (każdy dzień). Nazwisko: od wczoraj do 60 dni do przodu.
    let found = code.length === 6 ? await prisma.booking.findMany({ where: { code } }) : [];
    if (!found.length) {
      const words = p.data.q.split(/\s+/).filter((w) => w.length > 1);
      found = await prisma.booking.findMany({
        where: {
          AND: words.map((w) => ({ name: { contains: w, mode: "insensitive" as const } })),
          start: { gte: warsaw(addDays(todayWarsaw(), -1), "00:00"), lt: warsaw(addDays(todayWarsaw(), 60), "00:00") },
          status: { notIn: ["EXPIRED"] },
        },
        orderBy: { start: "asc" },
        take: 20,
      });
    }
    // Grupa: dociągamy pozostałe stanowiska z tej samej rezerwacji.
    const groups = [...new Set(found.map((b) => b.groupId).filter(Boolean))] as string[];
    if (groups.length) {
      const extra = await prisma.booking.findMany({ where: { groupId: { in: groups }, id: { notIn: found.map((b) => b.id) } } });
      found = [...found, ...extra].sort((a, b) => a.start.getTime() - b.start.getTime() || a.simulatorId.localeCompare(b.simulatorId));
    }
    return NextResponse.json({ results: found.map(deskRow) });
  }

  // Zgodność ze starym check-inem: samo {code}.
  if (typeof body?.code === "string" && !body.action) {
    const b = await prisma.booking.findUnique({ where: { code: cleanCode(body.code) } });
    if (!b) return NextResponse.json({ result: "not_found" });
    body.action = "confirm";
    body.ids = [b.id];
  }

  if (body?.action === "price") {
    const d = Price.safeParse(body);
    if (!d.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const b = await prisma.booking.findUnique({ where: { id: d.data.id } });
    if (!b || !["PAID", "COMPLETED", "NO_SHOW"].includes(b.status)) return NextResponse.json({ error: "invalid" }, { status: 400 });
    const paid = b.paidAt ? b.priceGross - b.refundAmount : 0;
    const adjust = d.data.price - paid;
    await prisma.booking.update({ where: { id: b.id }, data: { priceAdjust: adjust, priceAdjustNote: adjust ? d.data.note : null } });
    await audit(me.email, "Zmiana ceny na miejscu", { bookingId: b.id, details: `${b.code} ${b.name}: ${(paid / 100).toFixed(2)} → ${(d.data.price / 100).toFixed(2)} zł (${d.data.note})` });
    return NextResponse.json({ ok: true, adjust });
  }

  const p = Ids.safeParse(body);
  if (!p.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const list = await prisma.booking.findMany({ where: { id: { in: p.data.ids } } });
  const now = new Date();
  const done: string[] = [];
  const refused: { code: string; reason: string }[] = [];
  for (const b of list) {
    if (p.data.action === "confirm") {
      if (!["PAID", "NO_SHOW", "COMPLETED"].includes(b.status)) { refused.push({ code: b.code, reason: b.status === "PENDING" ? "nieopłacona" : "odwołana" }); continue; }
      if (b.start.getTime() - now.getTime() > 3 * 3600_000) { refused.push({ code: b.code, reason: "na inny termin" }); continue; }
      if (b.checkedInAt) { done.push(b.code); continue; }
      const status = b.status === "NO_SHOW" ? (b.end < now ? "COMPLETED" : "PAID") : b.status;
      await prisma.booking.update({ where: { id: b.id }, data: { checkedInAt: now, checkedInBy: me.email, status } });
      await audit(me.email, "Potwierdzenie przyjścia", { bookingId: b.id, details: `${b.code} ${b.name}` });
      done.push(b.code);
    } else if (p.data.action === "cancel") {
      // Odwołanie przez recepcję (np. gość zadzwonił): zwrot wg regulaminu, termin od razu wraca do sprzedaży.
      if (!["PAID", "PENDING"].includes(b.status) || b.checkedInAt) { refused.push({ code: b.code, reason: "nie można" }); continue; }
      const amount = b.status === "PAID" ? refundPolicy(b, now).refund : 0;
      try {
        await cancelBooking(b.id, "admin", amount);
      } catch (e) {
        if (e instanceof BookingError) { refused.push({ code: b.code, reason: "nie można" }); continue; }
        throw e;
      }
      await audit(me.email, "Odwołanie przez recepcję", { bookingId: b.id, details: `${b.code} ${b.name}, zwrot ${(amount / 100).toFixed(2)} zł` });
      done.push(b.code);
    } else if (p.data.action === "noshow") {
      if (b.status !== "PAID" || b.checkedInAt) { refused.push({ code: b.code, reason: "nie można" }); continue; }
      await prisma.booking.update({ where: { id: b.id }, data: { status: "NO_SHOW" } });
      await audit(me.email, "Nie przyszedł", { bookingId: b.id, details: `${b.code} ${b.name}` });
      done.push(b.code);
    } else {
      if (!b.checkedInAt && b.status !== "NO_SHOW") { refused.push({ code: b.code, reason: "nie można" }); continue; }
      await prisma.booking.update({ where: { id: b.id }, data: { checkedInAt: null, checkedInBy: null, status: b.status === "COMPLETED" || b.status === "NO_SHOW" ? (b.end < now ? "NO_SHOW" : "PAID") : b.status } });
      await audit(me.email, "Cofnięcie potwierdzenia", { bookingId: b.id, details: `${b.code} ${b.name}` });
      done.push(b.code);
    }
  }
  return NextResponse.json({ ok: refused.length === 0, done, refused });
}
