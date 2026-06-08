-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cities_name_key" ON "cities"("name");

-- Insert existing cities
INSERT INTO "cities" ("id", "name", "region", "isActive", "createdAt", "updatedAt") VALUES
('city_tana', 'Antananarivo', 'Analamanga', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_antsirabe', 'Antsirabe', 'Vakinankaratra', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('city_ambatolampy', 'Ambatolampy', 'Vakinankaratra', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add new columns to routes table
ALTER TABLE "routes" ADD COLUMN "departureId" TEXT;
ALTER TABLE "routes" ADD COLUMN "destinationId" TEXT;

-- Copy data from old enum columns to new foreign key columns
UPDATE "routes" SET "departureId" = 'city_tana' WHERE "departure" = 'Antananarivo';
UPDATE "routes" SET "departureId" = 'city_antsirabe' WHERE "departure" = 'Antsirabe';
UPDATE "routes" SET "departureId" = 'city_ambatolampy' WHERE "departure" = 'Ambatolampy';

UPDATE "routes" SET "destinationId" = 'city_tana' WHERE "destination" = 'Antananarivo';
UPDATE "routes" SET "destinationId" = 'city_antsirabe' WHERE "destination" = 'Antsirabe';
UPDATE "routes" SET "destinationId" = 'city_ambatolampy' WHERE "destination" = 'Ambatolampy';

-- Make new columns NOT NULL
ALTER TABLE "routes" ALTER COLUMN "departureId" SET NOT NULL;
ALTER TABLE "routes" ALTER COLUMN "destinationId" SET NOT NULL;

-- Add foreign key constraints
ALTER TABLE "routes" ADD CONSTRAINT "routes_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "routes" ADD CONSTRAINT "routes_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create new index
CREATE INDEX "routes_departureId_destinationId_idx" ON "routes"("departureId", "destinationId");

-- Drop old columns and index
DROP INDEX "routes_departure_destination_idx";
ALTER TABLE "routes" DROP COLUMN "departure";
ALTER TABLE "routes" DROP COLUMN "destination";

-- Drop old enum
DROP TYPE "City";