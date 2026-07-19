/*
  Warnings:

  - A unique constraint covering the columns `[orderNumber]` on the table `PurchaseOrder` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `orderNumber` to the `PurchaseOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN     "orderNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_orderNumber_key" ON "PurchaseOrder"("orderNumber");
