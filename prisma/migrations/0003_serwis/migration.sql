-- Wyłączanie stanowiska na serwis z panelu (status OUT_OF_SERVICE w tabeli Simulator).
ALTER TABLE "Simulator" ADD COLUMN "serviceNote" TEXT;
ALTER TABLE "Simulator" ADD COLUMN "serviceUntil" TIMESTAMP(3);
ALTER TABLE "Simulator" ADD COLUMN "serviceBy" TEXT;
