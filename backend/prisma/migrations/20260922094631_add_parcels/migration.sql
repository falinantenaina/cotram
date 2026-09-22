-- CreateEnum
CREATE TYPE "ParcelStatus" AS ENUM ('registered', 'in_transit', 'arrived', 'ready_for_pickup', 'delivered', 'returned');

-- CreateEnum
CREATE TYPE "ParcelPaymentStatus" AS ENUM ('unpaid', 'partial', 'paid');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'agent';

-- CreateTable
CREATE TABLE "parcels" (
    "id" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "retrievalCode" TEXT NOT NULL,
    "parcelType" TEXT NOT NULL,
    "description" TEXT,
    "note" TEXT,
    "weightKg" DOUBLE PRECISION,
    "departureCityId" TEXT NOT NULL,
    "arrivalCityId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "senderName" TEXT NOT NULL,
    "senderPhone" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "transportFee" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ParcelStatus" NOT NULL DEFAULT 'registered',
    "paymentStatus" "ParcelPaymentStatus" NOT NULL DEFAULT 'unpaid',
    "departureDate" TIMESTAMP(3) NOT NULL,
    "arrivalDate" TIMESTAMP(3),
    "storageFeePerDay" INTEGER NOT NULL DEFAULT 1000,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parcels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parcel_history" (
    "id" TEXT NOT NULL,
    "parcelId" TEXT NOT NULL,
    "status" "ParcelStatus" NOT NULL,
    "note" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parcel_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "parcels_trackingCode_key" ON "parcels"("trackingCode");

-- CreateIndex
CREATE UNIQUE INDEX "parcels_retrievalCode_key" ON "parcels"("retrievalCode");

-- CreateIndex
CREATE INDEX "parcels_status_idx" ON "parcels"("status");

-- CreateIndex
CREATE INDEX "parcels_paymentStatus_idx" ON "parcels"("paymentStatus");

-- CreateIndex
CREATE INDEX "parcels_scheduleId_idx" ON "parcels"("scheduleId");

-- CreateIndex
CREATE INDEX "parcel_history_parcelId_idx" ON "parcel_history"("parcelId");

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_departureCityId_fkey" FOREIGN KEY ("departureCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_arrivalCityId_fkey" FOREIGN KEY ("arrivalCityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcels" ADD CONSTRAINT "parcels_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parcel_history" ADD CONSTRAINT "parcel_history_parcelId_fkey" FOREIGN KEY ("parcelId") REFERENCES "parcels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
