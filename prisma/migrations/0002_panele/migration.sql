-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "checkedInBy" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "firstName" TEXT,
ADD COLUMN     "lastName" TEXT;

-- AlterTable
ALTER TABLE "MagicToken" ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'login';

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'pl',
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "bookingId" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_key" ON "Customer"("email");

-- CreateIndex
CREATE INDEX "Customer_lastName_idx" ON "Customer"("lastName");

-- CreateIndex
CREATE INDEX "Customer_phone_idx" ON "Customer"("phone");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_bookingId_idx" ON "AuditLog"("bookingId");

-- CreateIndex
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Karty gości z istniejących rezerwacji (jedna na e-mail, dane z najnowszej rezerwacji).
INSERT INTO "Customer" ("id", "email", "firstName", "lastName", "phone", "locale", "createdAt", "updatedAt")
SELECT DISTINCT ON (lower("email"))
  'c' || md5(lower("email")), lower("email"),
  split_part(btrim("name"), ' ', 1),
  btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 1)),
  "phone", "locale", "createdAt", CURRENT_TIMESTAMP
FROM "Booking"
ORDER BY lower("email"), "createdAt" DESC;

UPDATE "Booking" SET
  "customerId" = 'c' || md5(lower("email")),
  "firstName" = split_part(btrim("name"), ' ', 1),
  "lastName" = btrim(substr(btrim("name"), length(split_part(btrim("name"), ' ', 1)) + 1));
