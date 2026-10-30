import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkoutUrl, testPayAllowed } from "@/lib/payments";
import { appUrl } from "@/lib/templates";
import { manageUrl, verify } from "@/lib/tokens";

export const dynamic = "force-dynamic";

// Link z SMS-a przy rezerwacji telefonicznej: prowadzi prosto do płatności, a po zapłacie do rezerwacji.
export async function GET(req: Request, { params }: { params: { code: string } }) {
  const sig = new URL(req.url).searchParams.get("s");
  if (!verify("pay:" + params.code, sig)) return NextResponse.redirect(`${appUrl()}/rezerwacja`);
  const b = await prisma.booking.findUnique({ where: { code: params.code } });
  if (!b) return NextResponse.redirect(`${appUrl()}/rezerwacja`);
  if (b.status === "PAID" || b.status === "COMPLETED") return NextResponse.redirect(manageUrl(b.code));
  const open = b.status === "PENDING" && !!b.holdExpiresAt && b.holdExpiresAt > new Date();
  if (open && b.paymentRef) {
    const url = await checkoutUrl(b.paymentRef);
    if (url) return NextResponse.redirect(url);
  }
  if (open && testPayAllowed()) return NextResponse.redirect(`${appUrl()}/platnosc/test/${b.id}`);
  // Czas na zapłatę minął albo rezerwację odwołano: klient wybiera termin od nowa.
  return NextResponse.redirect(`${appUrl()}/rezerwacja`);
}
