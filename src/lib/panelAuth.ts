import { prisma } from "./db";
import { sendEmail } from "./notify";
import { appUrl, passwordEmail } from "./templates";
import { randomToken } from "./tokens";

/** Link do ustawienia hasła w panelu (zaproszenie albo „nie pamiętam hasła”). Ważny 24 h, jednorazowy. */
export async function sendPasswordLink(email: string, invite: boolean) {
  const token = randomToken();
  await prisma.magicToken.create({ data: { token, email, purpose: "password", expiresAt: new Date(Date.now() + 24 * 3600_000) } });
  const url = `${appUrl()}/panel/haslo?token=${token}`;
  await sendEmail({ to: email, ...passwordEmail(url, invite) });
  return url;
}
