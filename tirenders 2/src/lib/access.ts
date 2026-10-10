import type { Booking } from "@prisma/client";
import { currentUser } from "./auth";
import { verify } from "./tokens";

/** Klient może zarządzać rezerwacją z konta (ten sam użytkownik/e-mail) albo przez podpisany link z maila. */
export async function canManage(b: Booking, sig?: string | null) {
  if (sig && verify("manage:" + b.code, sig)) return true;
  const u = await currentUser();
  if (!u) return false;
  return b.userId === u.id || b.email === u.email;
}
