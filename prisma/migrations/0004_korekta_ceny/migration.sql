-- Recepcja może skorygować cenę na miejscu (dopłata albo upust) z podaniem powodu.
ALTER TABLE "Booking" ADD COLUMN "priceAdjust" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Booking" ADD COLUMN "priceAdjustNote" TEXT;

-- Płatności Tpay: adres strony płatności do linku z SMS-a.
ALTER TABLE "Booking" ADD COLUMN "paymentUrl" TEXT;
