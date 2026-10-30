import { NextResponse, type NextRequest } from "next/server";

// Strona „Wkrótce” przed otwarciem: gdy COMING_SOON=1, na tirenders.pl obcy widzą tylko licznik.
// Pełna strona do pokazywania działa w tym czasie pod 2realsimracing.vercel.app (bez indeksowania w Google).
// Właściciel może też wejść na tirenders.pl raz przez ?podglad=PREVIEW_KEY i dostaje ciasteczko na 60 dni.
const COOKIE = "podglad";
const GATED = (host: string) => host === "tirenders.pl" || host.endsWith(".tirenders.pl");

export function middleware(req: NextRequest) {
  const key = process.env.PREVIEW_KEY;
  if (process.env.COMING_SOON !== "1" || !key) return NextResponse.next();
  if (!GATED(req.nextUrl.hostname)) {
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

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

const PAGE = `<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#000"><title>2Real Simracing · Otwarcie 14.11</title><link rel="icon" href="/icon.svg">
<style>
*{box-sizing:border-box;margin:0}html,body{height:100%;background:#000;color:#f4f4f2;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif}
body{background:radial-gradient(ellipse 80% 55% at 50% 100%,rgba(255,42,42,.16),transparent 70%),#000}
main{min-height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(28px,6vh,56px);padding:40px 16px;text-align:center}
.logo{width:min(340px,72vw);height:auto}
.lights{display:flex;gap:10px}.lights i{width:12px;height:12px;border-radius:50%;background:#2a0a0a;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08);transition:background .25s,box-shadow .25s}
.lights i.on{background:#ff2a2a;box-shadow:0 0 14px #ff2a2a}
.count{display:flex;gap:clamp(10px,3vw,28px);font-variant-numeric:tabular-nums}
.u{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:clamp(58px,17vw,120px)}
.u b{font-size:clamp(40px,12vw,96px);font-weight:800;line-height:1;letter-spacing:-.02em}
.u small{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:#8c8c8c}
.sep{font-size:clamp(40px,12vw,96px);font-weight:300;line-height:1;color:#3a3a3a}
.when{font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:#8c8c8c;line-height:1.9}
.when span{color:#ff2a2a}
</style></head><body><main>
<img class="logo" src="/img/2real-logo.webp" alt="2Real Simracing by Tirenders" width="1109" height="384">
<div class="lights" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
<div class="count" role="timer" aria-label="Odliczanie do otwarcia">
<div class="u"><b id="d">--</b><small>dni</small></div><div class="sep">:</div>
<div class="u"><b id="h">--</b><small>godz</small></div><div class="sep">:</div>
<div class="u"><b id="m">--</b><small>min</small></div><div class="sep">:</div>
<div class="u"><b id="s">--</b><small>sek</small></div>
</div>
<p class="when">Otwarcie <span>14.11.2026</span> · Warszawa<br>Rezerwacje wkrótce</p>
</main>
<script>
var T=Date.parse("2026-11-14T10:00:00+01:00"),L=document.querySelectorAll(".lights i");
function p(n){return n<10?"0"+n:""+n}
function t(){var r=Math.max(0,T-Date.now()),x=Math.floor(r/1e3);
document.getElementById("d").textContent=p(Math.floor(x/86400));document.getElementById("h").textContent=p(Math.floor(x%86400/3600));
document.getElementById("m").textContent=p(Math.floor(x%3600/60));document.getElementById("s").textContent=p(x%60);
var k=x%6;for(var i=0;i<L.length;i++)L[i].className=i<k?"on":""}
t();setInterval(t,1000);
</script></body></html>`;
