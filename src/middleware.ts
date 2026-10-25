import { NextResponse, type NextRequest } from "next/server";

// Strona „Wkrótce” przed otwarciem: gdy COMING_SOON=1, obcy widzą tylko zapowiedź.
// Właściciel wchodzi raz przez ?podglad=PREVIEW_KEY i dostaje ciasteczko na 60 dni.
const COOKIE = "podglad";

export function middleware(req: NextRequest) {
  const key = process.env.PREVIEW_KEY;
  if (process.env.COMING_SOON !== "1" || !key) return NextResponse.next();

  const url = req.nextUrl;
  if (url.searchParams.get(COOKIE) === key) {
    url.searchParams.delete(COOKIE);
    const res = NextResponse.redirect(url);
    res.cookies.set(COOKIE, key, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 60 * 60 * 24 * 60, path: "/" });
    return res;
  }
  if (req.cookies.get(COOKIE)?.value === key) return NextResponse.next();

  const headers = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "no-store" };
  if (url.pathname.startsWith("/api/")) return NextResponse.json({ error: "wkrotce" }, { status: 403, headers });
  return new NextResponse(PAGE, { status: 200, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

export const config = {
  // Pliki strony, zadania automatyczne, webhook Stripe i health działają zawsze.
  matcher: ["/((?!_next/|_vercel/|img/|video/|icon\\.svg|favicon\\.ico|api/cron/|api/stripe/webhook|api/health).*)"],
};

const PAGE = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>2Real Simracing · Wkrótce</title><link rel="icon" href="/icon.svg">
<style>
*{box-sizing:border-box;margin:0}html,body{height:100%;background:#000;color:#f4f4f2;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;padding:32px 16px;text-align:center}
img{width:min(320px,70vw);height:auto}
h1{font-size:clamp(28px,7vw,56px);font-weight:800;letter-spacing:.02em;text-transform:uppercase}
h1 span{color:#ff2a2a}p{color:#8c8c8c;font-size:15px;letter-spacing:.18em;text-transform:uppercase}
</style></head><body><main>
<img src="/img/2real-logo.webp" alt="2Real Simracing by Tirenders">
<h1>Otwarcie <span>14.11</span></h1>
<p>Warszawa · Rezerwacje wkrótce</p>
</main></body></html>`;
