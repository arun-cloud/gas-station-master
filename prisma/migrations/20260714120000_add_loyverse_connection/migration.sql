-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "LoyverseConnectionStatus" AS ENUM ('PENDING_STORE_SELECTION', 'CONNECTED', 'DISCONNECTED', 'ERROR');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "LoyverseConnection" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "storeId" TEXT,
    "storeName" TEXT,
    "status" "LoyverseConnectionStatus" NOT NULL DEFAULT 'PENDING_STORE_SELECTION',
    "accessTokenEncrypted" TEXT NOT NULL,
    "refreshTokenEncrypted" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "scope" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastRefreshedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyverseConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LoyverseConnection_branchId_key" ON "LoyverseConnection"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "LoyverseConnection_storeId_key" ON "LoyverseConnection"("storeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LoyverseConnection_status_idx" ON "LoyverseConnection"("status");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "LoyverseConnection" ADD CONSTRAINT "LoyverseConnection_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
