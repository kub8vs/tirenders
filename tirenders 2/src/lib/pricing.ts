import { Duration, priceFor, simById } from "@/config/site";
import { prisma } from "./db";

export const gr = (pln: number) => Math.round(pln * 100);
export const pln = (grosze: number, locale = "pl") =>
  new Intl.NumberFormat(locale === "en" ? "en-GB" : "pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: grosze % 100 ? 2 : 0 }).format(grosze / 100);

export async function findDiscount(code?: string | null, now = new Date()) {
  if (!code) return null;
  const c = await prisma.discountCode.findUnique({ where: { code: code.trim().toUpperCase() } });
  if (!c || !c.active) return null;
  if (c.validFrom && c.validFrom > now) return null;
  if (c.validTo && c.validTo < now) return null;
  if (c.maxUses != null && c.uses >= c.maxUses) return null;
  return c;
}

export async function quote(simulatorId: string, duration: number, code?: string | null) {
  const sim = simById(simulatorId);
  if (!sim) throw new Error("sim");
  const list = gr(priceFor(sim.priceGroup, duration as Duration));
  const d = await findDiscount(code);
  let discount = 0;
  if (d?.percent) discount = Math.round((list * d.percent) / 100);
  else if (d?.amountOff) discount = Math.min(d.amountOff, list - 100);
  return { list, discount, total: list - discount, code: d?.code ?? null };
}

export function netOf(gross: number, vat: number) {
  const net = Math.round(gross / (1 + vat / 100));
  return { net, vat: gross - net };
}
