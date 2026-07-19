-- AlterTable: receipt-sync cursor on LoyverseConnection
ALTER TABLE "LoyverseConnection" ADD COLUMN IF NOT EXISTS "lastReceiptSyncedAt" TIMESTAMP(3);
ALTER TABLE "LoyverseConnection" ADD COLUMN IF NOT EXISTS "lastReceiptSyncError" TEXT;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "InvoiceSource" AS ENUM ('LOYVERSE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceSyncStatus" AS ENUM ('SYNCED', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "source" "InvoiceSource" NOT NULL DEFAULT 'LOYVERSE',
    "loyverseReceiptNumber" TEXT NOT NULL,
    "loyverseStoreId" TEXT NOT NULL,
    "loyverseOrder" TEXT,
    "loyversePosDeviceId" TEXT,
    "loyverseEmployeeId" TEXT,
    "loyverseCustomerId" TEXT,
    "receiptType" TEXT NOT NULL DEFAULT 'SALE',
    "refundFor" TEXT,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "totalMoney" DECIMAL(18,2) NOT NULL,
    "totalTax" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalDiscount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "totalPaid" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "syncStatus" "InvoiceSyncStatus" NOT NULL DEFAULT 'SYNCED',
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncError" TEXT,
    "rawPayload" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "loyverseLineItemId" TEXT,
    "loyverseVariantId" TEXT,
    "itemName" TEXT NOT NULL,
    "sku" TEXT,
    "quantity" DECIMAL(18,3) NOT NULL,
    "price" DECIMAL(18,2) NOT NULL,
    "cost" DECIMAL(18,2),
    "lineNote" TEXT,
    "grossTotal" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "loyversePaymentTypeId" TEXT,
    "paymentTypeName" TEXT,
    "moneyAmount" DECIMAL(18,2) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_branchId_loyverseReceiptNumber_key" ON "Invoice"("branchId", "loyverseReceiptNumber");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_branchId_receiptDate_idx" ON "Invoice"("branchId", "receiptDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_branchId_isActive_idx" ON "Invoice"("branchId", "isActive");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Invoice_syncStatus_idx" ON "Invoice"("syncStatus");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey"
    FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
