import { sendEmail } from "./notify";
import { allow } from "./ratelimit";

// Alarm do twórcy strony (OWNER_EMAILS), gdy coś ważnego się wysypie: płatność, rezerwacja, zadania automatyczne.
// Ten sam błąd najwyżej raz na 15 min, żeby przy awarii nie zasypać skrzynki.
export async function alarm(where: string, e: unknown) {
  console.error(`[alarm] ${where}`, e);
  if (process.env.VERCEL_ENV !== "production") return;
  const to = (process.env.OWNER_EMAILS ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!to.length || !(await allow(`alarm:${where}`, 1, 900).catch(() => true))) return;
  const msg = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  const when = new Intl.DateTimeFormat("pl-PL", { dateStyle: "short", timeStyle: "medium", timeZone: "Europe/Warsaw" }).format(new Date());
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  for (const addr of to) {
    await sendEmail({
      to: addr,
      subject: `Alarm Tirenders: błąd w „${where}”`,
      html: `<p><b>${esc(where)}</b> · ${when}</p><pre style="white-space:pre-wrap">${esc(msg.slice(0, 2000))}</pre><p>Szczegóły: Vercel → tirenders-vr52 → Logs. Kolejny taki alarm najwcześniej za 15 min.</p>`,
    }).catch(() => {});
  }
}
