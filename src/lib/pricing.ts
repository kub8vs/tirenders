import { Duration, groupPercent, priceFor, simById } from "@/config/site";
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

/**
 * Wycena jednego lub kilku stanowisk na ten sam termin.
 * Rabat grupowy (3+ stanowiska, cały salon) i kod rabatowy się nie sumują: liczy się większy.
 */
export async function quote(simulatorIds: string[], duration: number, code?: string | null) {
  const sims = simulatorIds.map((id) => simById(id));
  if (!sims.length || sims.some((s) => !s)) throw new Error("sim");
  const lists = sims.map((s) => gr(priceFor(s!.priceGroup, duration as Duration)));
  const list = lists.reduce((a, b) => a + b, 0);
  const percent = groupPercent(sims.length);
  const groupDiscount = Math.round((list * percent) / 100);
  const d = await findDiscount(code);
  let codeDiscount = 0;
  if (d?.percent) codeDiscount = Math.round((list * d.percent) / 100);
  else if (d?.amountOff) codeDiscount = Math.min(d.amountOff, list - 100);
  const useCode = codeDiscount > groupDiscount;
  const raw = useCode ? codeDiscount : groupDiscount;
  // rabat rozkładamy proporcjonalnie na stanowiska; rabat grupowy zaokrąglamy do pełnych złotych
  const items = lists.map((l, i) => {
    const exact = (raw * l) / list;
    const part = useCode ? Math.round(exact) : Math.round(exact / 100) * 100;
    return { simulatorId: simulatorIds[i], list: l, discount: part, total: l - part };
  });
  const discount = items.reduce((a, x) => a + x.discount, 0);
  return { list, discount, total: list - discount, code: d?.code ?? null, codeApplied: useCode && !!d, groupPercent: useCode ? 0 : percent, items };
}

export function netOf(gross: number, vat: number) {
  const net = Math.round(gross / (1 + vat / 100));
  return { net, vat: gross - net };
}
