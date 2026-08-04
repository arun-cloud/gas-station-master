-- Supplier.updatedAt is created by 20260728173000_supplier_module.
-- Prisma @updatedAt columns should not retain a database-level default.

ALTER TABLE "Supplier"
  ALTER COLUMN "updatedAt" DROP DEFAULT;