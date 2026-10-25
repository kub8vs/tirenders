import { prisma } from "./db";

/** Zapis do historii zmian. Nigdy nie blokuje właściwej akcji, nawet gdy zapis się nie uda. */
export async function audit(actor: string, action: string, opts: { bookingId?: string; details?: string } = {}) {
  await prisma.auditLog.create({ data: { actor, action, bookingId: opts.bookingId, details: opts.details } }).catch((e) => console.error("audit", e));
}
