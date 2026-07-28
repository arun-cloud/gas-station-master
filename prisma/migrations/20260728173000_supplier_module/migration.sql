-- Supplier module upgrade
-- Preserves existing Supplier rows while adding compliance, audit and branch assignment fields.

DO $$ BEGIN
  CREATE TYPE "SupplierType" AS ENUM (
    'FUEL',
    'PRODUCT',
    'SERVICE',
    'UTILITY',
    'GOVERNMENT',
    'OTHER'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Supplier"
  ADD COLUMN IF NOT EXISTS "supplierCode" TEXT,
  ADD COLUMN IF NOT EXISTS "nameEn" TEXT,
  ADD COLUMN IF NOT EXISTS "nameAr" TEXT,
  ADD COLUMN IF NOT EXISTS "legalName" TEXT,
  ADD COLUMN IF NOT EXISTS "type" "SupplierType" NOT NULL DEFAULT 'OTHER',
  ADD COLUMN IF NOT EXISTS "vatNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "crNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "address" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "paymentTermsDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "creditLimit" DECIMAL(18,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "notes" TEXT,
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing rows used `name`; retain that column for rollback safety but copy it
-- into the new English-name field.
UPDATE "Supplier"
SET "nameEn" = COALESCE(NULLIF(TRIM("nameEn"), ''), "name")
WHERE "nameEn" IS NULL OR TRIM("nameEn") = '';

-- Generate stable codes for any legacy rows.
WITH ranked AS (
  SELECT
    "id",
    'SUP-' || LPAD(ROW_NUMBER() OVER (ORDER BY "createdAt", "id")::TEXT, 5, '0') AS generated_code
  FROM "Supplier"
  WHERE "supplierCode" IS NULL OR TRIM("supplierCode") = ''
)
UPDATE "Supplier" s
SET "supplierCode" = ranked.generated_code
FROM ranked
WHERE s."id" = ranked."id";

ALTER TABLE "Supplier"
  ALTER COLUMN "supplierCode" SET NOT NULL,
  ALTER COLUMN "nameEn" SET NOT NULL,
  ALTER COLUMN "contactName" DROP NOT NULL,
  ALTER COLUMN "phone" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_supplierCode_key"
  ON "Supplier"("supplierCode");

CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_vatNumber_key"
  ON "Supplier"("vatNumber")
  WHERE "vatNumber" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "Supplier_crNumber_key"
  ON "Supplier"("crNumber")
  WHERE "crNumber" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Supplier_isActive_idx"
  ON "Supplier"("isActive");

CREATE INDEX IF NOT EXISTS "Supplier_type_idx"
  ON "Supplier"("type");

CREATE TABLE IF NOT EXISTS "SupplierBranch" (
  "id" TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SupplierBranch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SupplierBranch_supplierId_branchId_key"
  ON "SupplierBranch"("supplierId", "branchId");

CREATE INDEX IF NOT EXISTS "SupplierBranch_branchId_idx"
  ON "SupplierBranch"("branchId");

DO $$ BEGIN
  ALTER TABLE "SupplierBranch"
    ADD CONSTRAINT "SupplierBranch_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "SupplierBranch"
    ADD CONSTRAINT "SupplierBranch_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Existing suppliers become available to every active branch.
INSERT INTO "SupplierBranch" ("id", "supplierId", "branchId")
SELECT
  'sb_' || md5(s."id" || ':' || b."id"),
  s."id",
  b."id"
FROM "Supplier" s
CROSS JOIN "Branch" b
WHERE b."isActive" = true
ON CONFLICT ("supplierId", "branchId") DO NOTHING;
