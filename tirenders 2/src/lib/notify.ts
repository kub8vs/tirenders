import { prisma } from "./db";

// E-mail: Resend (RESEND_API_KEY, MAIL_FROM). SMS: SMSAPI.pl (SMSAPI_TOKEN, SMS_FROM).
// Bez kluczy wiadomości trafiają tylko do logu (status DEV) – widać je w panelu /admin/powiadomienia.

export type Attachment = { filename: string; content: Buffer };

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string; attachments?: Attachment[]; bookingId?: string }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Tirenders <rezerwacje@tirenders.pl>";
  let status = "DEV";
  let error: string | undefined;
  if (key) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: [opts.to],
          subject: opts.subject,
          html: opts.html,
          text: opts.text,
          attachments: opts.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64") })),
        }),
      });
      status = res.ok ? "SENT" : "FAILED";
      if (!res.ok) error = (await res.text()).slice(0, 500);
    } catch (e) {
      status = "FAILED";
      error = String(e).slice(0, 500);
    }
  } else {
    console.log(`[mail:dev] → ${opts.to} | ${opts.subject}`);
  }
  await prisma.notificationLog.create({
    data: { channel: "EMAIL", to: opts.to, subject: opts.subject, body: opts.text ?? opts.html.slice(0, 4000), status, error, bookingId: opts.bookingId },
  });
  return status !== "FAILED";
}

export function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("00")) return "+" + digits.slice(2);
  if (digits.length === 9) return "+48" + digits;
  return "+" + digits;
}

export async function sendSms(to: string, message: string, bookingId?: string) {
  const token = process.env.SMSAPI_TOKEN;
  const phone = normalizePhone(to);
  let status = "DEV";
  let error: string | undefined;
  if (token) {
    try {
      const body = new URLSearchParams({
        to: phone.replace("+", ""),
        message,
        from: process.env.SMS_FROM || "TIRENDERS",
        normalize: "1",
        format: "json",
        encoding: "utf-8",
      });
      const res = await fetch("https://api.smsapi.pl/sms.do", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });
      const json = (await res.json().catch(() => ({}))) as { error?: number; message?: string };
      status = res.ok && !json.error ? "SENT" : "FAILED";
      if (status === "FAILED") error = JSON.stringify(json).slice(0, 500);
    } catch (e) {
      status = "FAILED";
      error = String(e).slice(0, 500);
    }
  } else {
    console.log(`[sms:dev] → ${phone} | ${message}`);
  }
  await prisma.notificationLog.create({ data: { channel: "SMS", to: phone, body: message, status, error, bookingId } });
  return status !== "FAILED";
}
