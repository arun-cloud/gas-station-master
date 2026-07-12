/*
  Warnings:

  - You are about to drop the column `branchId` on the `Nozzle` table. All the data in the column will be lost.
  - You are about to alter the column `currentReading` on the `Nozzle` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(18,3)`.
  - A unique constraint covering the columns `[branchId,tankNumber]` on the table `FuelTank` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Nozzle" DROP CONSTRAINT "Nozzle_dispenserID_fkey";

-- AlterTable
ALTER TABLE "Nozzle" DROP COLUMN "branchId",
ALTER COLUMN "currentReading" SET DATA TYPE DECIMAL(18,3);

-- CreateIndex
CREATE UNIQUE INDEX "FuelTank_branchId_tankNumber_key" ON "FuelTank"("branchId", "tankNumber");

-- AddForeignKey
ALTER TABLE "Nozzle" ADD CONSTRAINT "Nozzle_dispenserID_fkey" FOREIGN KEY ("dispenserID") REFERENCES "Dispenser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
