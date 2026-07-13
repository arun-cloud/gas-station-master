-- AlterTable: add audit fields + soft-disable flag to Branch
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "createdBy" TEXT;
ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "updatedBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Branch_isActive_idx" ON "Branch"("isActive");
