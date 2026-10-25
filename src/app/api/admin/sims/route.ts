import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { simById } from "@/config/site";
import { audit } from "@/lib/audit";
import { staffUser } from "@/lib/auth";
import { dayWindow } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { SIMS_TAG, affectedBookings } from "@/lib/sims";
import { todayWarsaw } from "@/lib/time";

const Body = z.object({
  id: z.string(),
  on: z.boolean(), // true = stanowisko w serwisie
  note: z.string().trim().max(200).optional(),
  // na ile: liczba godzin, "today" = do zamknięcia dziś, null = do odwołania
  until: z.union([z.number().min(0.25).max(24 * 14), z.literal("today"), z.null()]).optional(),
});

export async function POST(req: Request) {
  const me = await staffUser("service");
  if (!me) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  const sim = parsed.success ? simById(parsed.data.id) : null;
  if (!parsed.success || !sim || sim.status !== "ACTIVE") return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;

  let until: Date | null = null;
  if (d.on && typeof d.until === "number") until = new Date(Date.now() + d.until * 3600_000);
  if (d.on && d.until === "today") until = dayWindow(todayWarsaw())?.close ?? new Date(Date.now() + 3600_000);

  await prisma.simulator.update({
    where: { id: sim.id },
    data: d.on
      ? { status: "OUT_OF_SERVICE", serviceNote: d.note || null, serviceUntil: until, serviceBy: me.email }
      : { status: "ACTIVE", serviceNote: null, serviceUntil: null, serviceBy: null },
  });
  revalidateTag(SIMS_TAG);
  await audit(me.email, d.on ? "Stanowisko w serwisie" : "Stanowisko znów działa", {
    details: `${sim.name}${d.on ? `, ${until ? `do ${until.toISOString()}` : "do odwołania"}${d.note ? `: ${d.note}` : ""}` : ""}`,
  });
  const affected = d.on ? await affectedBookings(sim.id, until) : [];
  return NextResponse.json({ ok: true, affected });
}
