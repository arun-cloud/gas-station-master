-- AlterTable: add audit fields + soft-disable flag to Dispenser
ALTER TABLE "Dispenser" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Dispenser" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Dispenser" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Dispenser_isActive_idx" ON "Dispenser"("isActive");

-- AlterTable: add audit fields + soft-disable flag to Nozzle
ALTER TABLE "Nozzle" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Nozzle" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Nozzle" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Nozzle_isActive_idx" ON "Nozzle"("isActive");

-- AlterTable: add audit fields + soft-disable flag to FuelTank
ALTER TABLE "FuelTank" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "FuelTank" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "FuelTank" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FuelTank_isActive_idx" ON "FuelTank"("isActive");
