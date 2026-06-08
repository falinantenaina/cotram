-- AlterTable
ALTER TABLE "schedules" ADD COLUMN "seatTemplateId" TEXT;

-- CreateIndex
CREATE INDEX "schedules_seatTemplateId_idx" ON "schedules"("seatTemplateId");

-- AddForeignKey
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_seatTemplateId_fkey" FOREIGN KEY ("seatTemplateId") REFERENCES "seat_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
