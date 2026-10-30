-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "locale" TEXT NOT NULL DEFAULT 'pl',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicToken" (
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "Simulator" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "priceGroup" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Simulator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "simulatorId" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "priceGross" INTEGER NOT NULL,
    "listPriceGross" INTEGER NOT NULL,
    "discountCode" TEXT,
    "discountAmount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "holdExpiresAt" TIMESTAMP(3),
    "paymentProvider" TEXT,
    "paymentRef" TEXT,
    "paymentMethod" TEXT,
    "paidAt" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "refundAmount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'ONLINE',
    "groupId" TEXT,
    "note" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'pl',
    "remind24At" TIMESTAMP(3),
    "remind10At" TIMESTAMP(3),
    "reviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiscountCode" (
    "code" TEXT NOT NULL,
    "percent" INTEGER,
    "amountOff" INTEGER,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "maxUses" INTEGER,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiscountCode_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationLog" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_code_key" ON "Booking"("code");

-- CreateIndex
CREATE INDEX "Booking_simulatorId_start_idx" ON "Booking"("simulatorId", "start");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_email_idx" ON "Booking"("email");

-- CreateIndex
CREATE INDEX "Booking_groupId_idx" ON "Booking"("groupId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_simulatorId_fkey" FOREIGN KEY ("simulatorId") REFERENCES "Simulator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Jedno stanowisko nie może mieć dwóch aktywnych rezerwacji, które na siebie nachodzą
-- (łącznie z 15-minutową przerwą po sesji, BOOKING.bufferMin w src/config/site.ts).
-- Pilnuje tego baza, więc nawet tysiąc kliknięć w tej samej sekundzie sprzeda termin tylko raz.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD CONSTRAINT "booking_time_valid" CHECK ("end" > "start");

ALTER TABLE "Booking" ADD CONSTRAINT "booking_no_overlap" EXCLUDE USING gist (
  "simulatorId" WITH =,
  tsrange("start", "end" + interval '15 minutes', '[)') WITH &&
) WHERE ("status" IN ('PENDING', 'PAID', 'COMPLETED', 'NO_SHOW'));

-- Stanowiska (to samo co prisma/seed.mjs), żeby produkcja działała od pierwszej migracji.
INSERT INTO "Simulator" ("id", "name", "priceGroup", "status", "sortOrder") VALUES
  ('bmw-m4', 'BMW M4 F82', 'STANDARD', 'ACTIVE', 1),
  ('bmw-e46', 'BMW E46', 'STANDARD', 'ACTIVE', 2),
  ('dof5-a', 'Motion 5DOF #1', 'MOTION5', 'ACTIVE', 3),
  ('dof5-b', 'Motion 5DOF #2', 'MOTION5', 'ACTIVE', 4),
  ('dof6', 'Motion 6DOF', 'MOTION6', 'ACTIVE', 5),
  ('gt3', 'GT3 Cockpit', 'GT3', 'ACTIVE', 6),
  ('nissan-370z', 'Nissan 370Z', 'STANDARD', 'COMING_SOON', 7)
ON CONFLICT ("id") DO NOTHING;
