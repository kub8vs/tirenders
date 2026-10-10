import ManageBooking from "@/components/booking/ManageBooking";
import { simById } from "@/config/site";
import { canManage } from "@/lib/access";
import { refundPolicy } from "@/lib/bookings";
import { prisma } from "@/lib/db";
import { getLang, tr } from "@/lib/i18n";
import { pln } from "@/lib/pricing";
import { fmtLong } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "Twoja rezerwacja", robots: { index: false } };

const STATUS = {
  pl: { PAID: "Opłacona", COMPLETED: "Zrealizowana", CANCELLED: "Odwołana", REFUNDED: "Odwołana, zwrot w drodze", EXPIRED: "Wygasła", PENDING: "Czeka na płatność", NO_SHOW: "Nieobecność" },
  en: { PAID: "Paid", COMPLETED: "Completed", CANCELLED: "Cancelled", REFUNDED: "Cancelled, refund on its way", EXPIRED: "Expired", PENDING: "Awaiting payment", NO_SHOW: "No-show" },
} as const;

export default async function Page({ searchParams }: { searchParams: { c?: string; s?: string } }) {
  const l = getLang();
  const b = searchParams.c ? await prisma.booking.findUnique({ where: { code: searchParams.c.toUpperCase() } }) : null;
  if (!b || !(await canManage(b, searchParams.s))) {
    return (
      <div className="wrap page-hero" style={{ minHeight: "70vh" }}>
        <h1>{tr(l, { pl: "Link nie działa.", en: "This link doesn't work." })}</h1>
        <p>{tr(l, { pl: "Otwórz link z maila z potwierdzeniem albo zaloguj się na konto.", en: "Open the link from your confirmation email or sign in to your account." })}</p>
      </div>
    );
  }
  const p = refundPolicy(b);
  return (
    <div className="wrap page-hero" style={{ minHeight: "80vh" }}>
      <p className="eyebrow">
        {tr(l, { pl: "Rezerwacja", en: "Booking" })} {b.code} · {STATUS[l][b.status as keyof (typeof STATUS)["pl"]] ?? b.status}
      </p>
      <h1 style={{ fontSize: "clamp(40px, 6vw, 96px)" }}>{fmtLong(b.start, l)}</h1>
      <p>
        {simById(b.simulatorId)?.name} · {b.durationMin} min · {pln(b.priceGross, l)}
      </p>
      <ManageBooking
        b={{ id: b.id, code: b.code, simulatorId: b.simulatorId, start: b.start.toISOString(), durationMin: b.durationMin, priceGross: b.priceGross, status: b.status }}
        sig={searchParams.s}
        lang={l}
        canCancel={p.canCancel}
        canReschedule={p.canReschedule}
        refund={p.refund}
      />
    </div>
  );
}
