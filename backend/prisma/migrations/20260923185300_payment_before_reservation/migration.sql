/*
  Warnings:

  - Added the required column `scheduleId` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `seats` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_reservationId_fkey";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "scheduleId" TEXT NOT NULL,
ADD COLUMN     "seats" JSONB NOT NULL,
ALTER COLUMN "reservationId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "payments_scheduleId_idx" ON "payments"("scheduleId");

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
