-- Enable pgcrypto for gen_random_uuid() used in the backfill below.
-- Supabase Postgres has this available by default.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateTable
CREATE TABLE "UserBranch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserBranch_pkey" PRIMARY KEY ("id")
);

-- Backfill: move any existing single-branch assignment into the join table
-- before the old column is dropped. Safe to run even if User.branchId
-- has no rows or the column doesn't exist yet.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'branchId'
  ) THEN
    INSERT INTO "UserBranch" ("id", "userId", "branchId", "isPrimary", "createdAt")
    SELECT gen_random_uuid()::text, "id", "branchId", true, CURRENT_TIMESTAMP
    FROM "User"
    WHERE "branchId" IS NOT NULL;
  END IF;
END $$;

-- DropForeignKey (old single-branch FK, if present)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_branchId_fkey";

-- AlterTable: drop old column, add audit fields, flip isActive default
ALTER TABLE "User" DROP COLUMN IF EXISTS "branchId";
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;
ALTER TABLE "User" ALTER COLUMN "isActive" SET DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "UserBranch_userId_branchId_key" ON "UserBranch"("userId", "branchId");
CREATE INDEX "UserBranch_branchId_idx" ON "UserBranch"("branchId");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- AddForeignKey
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserBranch" ADD CONSTRAINT "UserBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
