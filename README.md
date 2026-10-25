# Tirenders × 2Real Simracing

Strona salonu sim racingu w Warszawie: intro WebGL „Lights Out”, własny system rezerwacji 6 stanowisk,
płatności online, maile i SMS-y, konto klienta, panel obsługi z raportami Excel.

## Start lokalnie

```bash
npm install
cp .env.example .env   # uzupełnij AUTH_SECRET i SEED_OWNER_PASSWORD
npx prisma db push
npm run db:seed
npm run dev            # http://localhost:3100
```

Panel obsługi: `/admin` (konto właściciela z `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`).
Bez kluczy Stripe/Resend/SMSAPI wszystko działa w trybie testowym: płatność przez `/platnosc/test/...`,
wiadomości widać w panelu w zakładce „Powiadomienia”.

## Gdzie co zmienić

- `src/config/site.ts` – godziny otwarcia, ceny, stanowiska, zasady rezerwacji, dane kontaktowe (wszystko z TODO to wartości przykładowe)
- `src/content/dict.ts` – teksty strony głównej PL/EN
- `src/components/hero/lightsScene.ts` – intro 3D
- `src/lib/report.ts` – arkusze raportu Excel

## Produkcja (Vercel)

1. Postgres (np. Neon/Supabase): zmień `provider` w `prisma/schema.prisma` na `postgresql`, ustaw `DATABASE_URL`.
2. Zmienne z `.env.example` w ustawieniach projektu.
3. Stripe: webhook na `https://DOMENA/api/stripe/webhook` (zdarzenia `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.expired`); włącz BLIK i Przelewy24 w panelu Stripe.
4. `vercel.json` uruchamia raport dzienny (`/api/cron/daily`) oraz co minutę w godzinach 5:00–22:59 UTC przypomnienia i wygaszanie płatności (`/api/cron/tick`; nocą baza może zasnąć i nie nalicza kosztów). Wymaga zmiennej `CRON_SECRET` i planu Pro.
