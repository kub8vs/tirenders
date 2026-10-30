import type { Booking } from "@prisma/client";
import { BOOKING, SITE, simById } from "@/config/site";
import { pln } from "./pricing";
import { fmtLong, fmtDate, fmtTime } from "./time";
import { manageUrl, payUrl, siteUrl } from "./tokens";

export const appUrl = siteUrl;

type L = "pl" | "en";
const lang = (b: { locale: string }): L => (b.locale === "en" ? "en" : "pl");

function shell(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#050505;color:#eaeaea;font-family:Helvetica,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#050505"><tr><td align="center" style="padding:32px 16px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">
<tr><td style="padding-bottom:28px;font-weight:700;letter-spacing:.32em;font-size:13px;color:#fff">TIRENDERS <span style="color:#777;letter-spacing:.2em">× ${SITE.salon.toUpperCase()}</span></td></tr>
<tr><td style="font-size:30px;line-height:1.1;color:#fff;font-weight:600;padding-bottom:18px">${title}</td></tr>
<tr><td style="font-size:15px;line-height:1.6;color:#bdbdbd">${body}</td></tr>
<tr><td style="padding-top:36px;font-size:12px;color:#666;line-height:1.6">${SITE.salon} · ${SITE.city}${SITE.address ? " · " + SITE.address : ""}<br>${SITE.email}</td></tr>
</table></td></tr></table></body></html>`;
}

function rows(b: Booking, l: L) {
  const sim = simById(b.simulatorId);
  const r = (k: string, v: string) =>
    `<tr><td style="padding:10px 0;border-bottom:1px solid #1d1d1d;color:#777;font-size:13px">${k}</td><td style="padding:10px 0;border-bottom:1px solid #1d1d1d;color:#fff;text-align:right">${v}</td></tr>`;
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0">${[
    r(l === "pl" ? "Kiedy" : "When", fmtLong(b.start, l)),
    r(l === "pl" ? "Stanowisko" : "Rig", sim?.name ?? b.simulatorId),
    r(l === "pl" ? "Czas" : "Duration", `${b.durationMin} min`),
    r(l === "pl" ? "Zapłacono" : "Paid", pln(b.priceGross, l)),
    r(l === "pl" ? "Kod" : "Code", `<b style="letter-spacing:.2em">${b.code}</b>`),
  ].join("")}</table>`;
}

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#fff;color:#000;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:14px;font-weight:600">${label}</a>`;

export function confirmationEmail(b: Booking) {
  const l = lang(b);
  const pl = {
    subject: `Pole position zajęte · ${fmtDate(b.start, l, { day: "numeric", month: "long" })}, ${fmtTime(b.start)}`,
    title: "Pole position zajęte.",
    body: `Cześć ${b.name.split(" ")[0]}, Twoje stanowisko czeka.${rows(b, l)}
<p style="text-align:center;margin:24px 0"><span style="display:inline-block;background:#fff;color:#000;padding:14px 26px;border-radius:14px;font-size:30px;font-weight:700;letter-spacing:.18em">${b.code}</span></p>
<p style="margin:0 0 16px">Na recepcji podaj ten kod albo swoje imię i nazwisko. Prosimy o przybycie do salonu <b style="color:#fff">${BOOKING.arriveEarlyMin} minut przed godziną rezerwacji</b>: ustawimy fotel, pedały i powiemy, gdzie hamować.</p>
<p style="margin:0 0 22px">Odwołanie bez kosztów do ${BOOKING.freeCancelHours} h przed startem. Później możesz już tylko przełożyć termin (do ${BOOKING.rescheduleHours} h przed).</p>
${btn(manageUrl(b.code), "Zarządzaj rezerwacją")}`,
  };
  const en = {
    subject: `Pole position secured · ${fmtDate(b.start, l, { day: "numeric", month: "long" })}, ${fmtTime(b.start)}`,
    title: "Pole position secured.",
    body: `Hi ${b.name.split(" ")[0]}, your rig is waiting.${rows(b, l)}
<p style="text-align:center;margin:24px 0"><span style="display:inline-block;background:#fff;color:#000;padding:14px 26px;border-radius:14px;font-size:30px;font-weight:700;letter-spacing:.18em">${b.code}</span></p>
<p style="margin:0 0 16px">At the front desk give us this code or your full name. Please arrive at the venue <b style="color:#fff">${BOOKING.arriveEarlyMin} minutes before your booking time</b> so we can set your seat and pedals and tell you where to brake.</p>
<p style="margin:0 0 22px">Free cancellation up to ${BOOKING.freeCancelHours} h before the start. After that you can only reschedule (up to ${BOOKING.rescheduleHours} h before).</p>
${btn(manageUrl(b.code), "Manage booking")}`,
  };
  const t = l === "pl" ? pl : en;
  return { subject: t.subject, html: shell(t.title, t.body), text: `${t.title} ${fmtLong(b.start, l)} · ${simById(b.simulatorId)?.name} · ${b.durationMin} min · ${b.code}` };
}

export function confirmationSms(b: Booking) {
  const sim = simById(b.simulatorId)?.name;
  const when = `${fmtDate(b.start, "pl", { day: "2-digit", month: "2-digit" })} ${fmtTime(b.start)}`;
  return lang(b) === "pl"
    ? `TIRENDERS: Rezerwacja potwierdzona. ${when}, ${sim}, ${b.durationMin} min. Kod: ${b.code}. Na recepcji podaj kod albo imie i nazwisko, badz ${BOOKING.arriveEarlyMin} min wczesniej. Zarzadzaj: ${manageUrl(b.code)}`
    : `TIRENDERS: Booking confirmed. ${when}, ${sim}, ${b.durationMin} min. Code: ${b.code}. Give the code or your name at the desk, ${BOOKING.arriveEarlyMin} min early. Manage: ${manageUrl(b.code)}`;
}

export function reminder24(b: Booking) {
  const l = lang(b);
  const sim = simById(b.simulatorId)?.name;
  const t = fmtTime(b.start);
  const email =
    l === "pl"
      ? { subject: `Jutro o ${t} jedziesz`, title: "Jutro jedziesz.", body: `Przypominamy o sesji.${rows(b, l)}<p>Weź wygodne buty z cienką podeszwą. W kaskach i rękawiczkach nie musisz przychodzić, wszystko mamy na miejscu.</p>${btn(manageUrl(b.code), "Zarządzaj rezerwacją")}` }
      : { subject: `Tomorrow at ${t} you drive`, title: "You drive tomorrow.", body: `A quick reminder about your session.${rows(b, l)}<p>Wear comfy shoes with thin soles. Everything else is on us.</p>${btn(manageUrl(b.code), "Manage booking")}` };
  const sms =
    l === "pl"
      ? `TIRENDERS: Jutro o ${t} masz ${sim} (${b.durationMin} min). Kod: ${b.code}. Do zobaczenia!`
      : `TIRENDERS: Tomorrow at ${t} you're on ${sim} (${b.durationMin} min). Code: ${b.code}. See you!`;
  return { email: { subject: email.subject, html: shell(email.title, email.body) }, sms };
}

export function reminder10(b: Booking) {
  const l = lang(b);
  const sim = simById(b.simulatorId)?.name;
  const email =
    l === "pl"
      ? { subject: "Za 10 minut start", title: "Za 10 minut start.", body: `Stanowisko <b style="color:#fff">${sim}</b> jest gotowe. Na recepcji podaj kod <b style="color:#fff">${b.code}</b> albo imię i nazwisko.` }
      : { subject: "Lights out in 10 minutes", title: "Lights out in 10 minutes.", body: `Rig <b style="color:#fff">${sim}</b> is ready. Give the code <b style="color:#fff">${b.code}</b> or your name at the desk.` };
  const sms =
    l === "pl"
      ? `TIRENDERS: Za 10 min start! ${sim}, kod ${b.code}. Podaj go na recepcji.`
      : `TIRENDERS: Lights out in 10 min! ${sim}, code ${b.code}. Give it at the desk.`;
  return { email: { subject: email.subject, html: shell(email.title, email.body) }, sms };
}

export function reviewEmail(b: Booking) {
  const l = lang(b);
  const url = process.env.GOOGLE_REVIEW_URL || SITE.instagram.salon;
  return l === "pl"
    ? { subject: "Jak było na torze?", html: shell("Jak było na torze?", `Dzięki za wizytę. Jeśli było grubo, zostaw nam opinię w Google: to dla nas paliwo.<p style="margin:24px 0">${btn(url, "Wystaw opinię")}</p>Następna sesja? <a href="${appUrl()}/rezerwacja" style="color:#fff">Zarezerwuj kolejny stint</a>.`) }
    : { subject: "How was the track?", html: shell("How was the track?", `Thanks for coming by. If it was a blast, leave us a Google review: it's fuel for us.<p style="margin:24px 0">${btn(url, "Leave a review")}</p>Next session? <a href="${appUrl()}/rezerwacja" style="color:#fff">Book another stint</a>.`) };
}

export function cancelledEmail(b: Booking, refund: number, reason: "customer" | "conflict" | "admin") {
  const l = lang(b);
  const money = refund > 0 ? (l === "pl" ? `Zwrot ${pln(refund, l)} wróci na Twoje konto w ciągu kilku dni roboczych.` : `A refund of ${pln(refund, l)} will reach your account within a few business days.`) : l === "pl" ? "Ta rezerwacja nie kwalifikuje się do zwrotu." : "This booking is not eligible for a refund.";
  const why =
    reason === "conflict"
      ? l === "pl" ? "Płatność dotarła po czasie, a ktoś zdążył zająć ten termin. Przepraszamy, zwracamy całą kwotę." : "Your payment arrived after the hold expired and someone took the slot. Sorry, we're refunding the full amount."
      : l === "pl" ? "Rezerwacja została odwołana." : "Your booking has been cancelled.";
  return l === "pl"
    ? { subject: `Rezerwacja ${b.code} odwołana`, html: shell("Rezerwacja odwołana.", `${why}${rows(b, l)}<p>${money}</p>${btn(`${appUrl()}/rezerwacja`, "Wybierz nowy termin")}`) }
    : { subject: `Booking ${b.code} cancelled`, html: shell("Booking cancelled.", `${why}${rows(b, l)}<p>${money}</p>${btn(`${appUrl()}/rezerwacja`, "Pick a new slot")}`) };
}

export function rescheduledEmail(b: Booking) {
  const l = lang(b);
  return l === "pl"
    ? { subject: `Nowy termin: ${fmtLong(b.start, l)}`, html: shell("Termin zmieniony.", `Zapisaliśmy nowy termin.${rows(b, l)}${btn(manageUrl(b.code), "Zarządzaj rezerwacją")}`) }
    : { subject: `New time: ${fmtLong(b.start, l)}`, html: shell("Rescheduled.", `Your new slot is saved.${rows(b, l)}${btn(manageUrl(b.code), "Manage booking")}`) };
}

/** Rezerwacja przez telefon: link do zapłaty (całość grupy w jednej płatności). */
export function payLinkEmail(list: Booking[]) {
  const b = list[0];
  const total = list.reduce((a, x) => a + x.priceGross, 0);
  const sims = list.map((x) => simById(x.simulatorId)?.name ?? x.simulatorId).join(", ");
  const until = b.holdExpiresAt ? fmtLong(b.holdExpiresAt, "pl") : "";
  return {
    subject: `Zapłać za rezerwację ${b.code} · ${fmtLong(b.start, "pl")}`,
    html: shell(
      "Termin czeka na Ciebie.",
      `Cześć ${b.name.split(" ")[0]}, zarezerwowaliśmy dla Ciebie: <b style="color:#fff">${sims}</b>, ${fmtLong(b.start, "pl")}, ${b.durationMin} min.
<p>Do zapłaty: <b style="color:#fff">${pln(total, "pl")}</b>${list.reduce((a, x) => a + x.discountAmount, 0) > 0 ? ` (po rabacie ${pln(list.reduce((a, x) => a + x.discountAmount, 0), "pl")})` : ""} (BLIK, karta, Apple Pay, Google Pay). Termin trzymamy do <b style="color:#fff">${until}</b>, potem wraca do sprzedaży.</p>
<p style="margin:24px 0">${btn(payUrl(b.code), "Zapłać i potwierdź")}</p>`,
    ),
    text: `Zapłać ${pln(total, "pl")} za rezerwację ${b.code}: ${payUrl(b.code)}`,
  };
}

export function payLinkSms(list: Booking[]) {
  const b = list[0];
  const total = list.reduce((a, x) => a + x.priceGross, 0);
  const when = `${fmtDate(b.start, "pl", { day: "2-digit", month: "2-digit" })} ${fmtTime(b.start)}`;
  const until = b.holdExpiresAt ? `${fmtDate(b.holdExpiresAt, "pl", { day: "2-digit", month: "2-digit" })} ${fmtTime(b.holdExpiresAt)}` : "";
  return `TIRENDERS: Rezerwacja ${when} czeka na platnosc ${(total / 100).toFixed(0)} zl do ${until}. Zaplac: ${payUrl(b.code)}`;
}

export function staffEmail(b: Booking) {
  return {
    subject: `Nowa rezerwacja ${b.code} · ${fmtLong(b.start, "pl")}`,
    html: shell("Nowa rezerwacja", `${rows(b, "pl")}<p>Klient: ${b.name} · ${b.email} · ${b.phone}</p><p><a style="color:#fff" href="${appUrl()}/panel">Otwórz panel</a></p>`),
  };
}

export function magicEmail(url: string, l: L) {
  return l === "pl"
    ? { subject: "Twój link do logowania", html: shell("Wsiadaj.", `Kliknij, żeby się zalogować. Link działa 20 minut i tylko raz.<p style="margin:24px 0">${btn(url, "Zaloguj się")}</p>Jeśli to nie Ty, zignoruj tę wiadomość.`) }
    : { subject: "Your sign-in link", html: shell("Jump in.", `Click to sign in. The link works for 20 minutes, once.<p style="margin:24px 0">${btn(url, "Sign in")}</p>If this wasn't you, ignore this email.`) };
}

export function passwordEmail(url: string, invite: boolean) {
  return invite
    ? { subject: "Dostęp do panelu 2Real Simracing", html: shell("Witaj w zespole.", `Masz dostęp do panelu salonu. Kliknij, żeby ustawić swoje hasło. Link działa 24 godziny i tylko raz.<p style="margin:24px 0">${btn(url, "Ustaw hasło")}</p>Potem logujesz się na ${appUrl()}/panel swoim e-mailem i hasłem.`) }
    : { subject: "Ustaw hasło do panelu", html: shell("Nowe hasło.", `Kliknij, żeby ustawić hasło do panelu. Link działa 24 godziny i tylko raz.<p style="margin:24px 0">${btn(url, "Ustaw hasło")}</p>Jeśli to nie Ty, zignoruj tę wiadomość: obecne hasło dalej działa.`) };
}

export function reportEmail(title: string, summary: string) {
  return shell(title, summary);
}
