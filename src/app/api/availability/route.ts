import { NextResponse } from "next/server";
import { BOOKING } from "@/config/site";
import { bookableDates, dayAvailability } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const date = u.searchParams.get("date");
  const duration = Number(u.searchParams.get("duration"));
  if (!date) return NextResponse.json({ dates: bookableDates() });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !BOOKING.durations.includes(duration as never)) return NextResponse.json({ error: "invalid" }, { status: 400 });
  // Przy tysiącach osób na stronie ta sama odpowiedź idzie z CDN przez kilka sekund, zamiast pytać bazę przy każdym wejściu.
  // Nieaktualny wolny termin nic nie psuje: przy kliknięciu „Rezerwuj” baza i tak sprawdza go jeszcze raz.
  return NextResponse.json(await dayAvailability(date, duration), {
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=25" },
  });
}
