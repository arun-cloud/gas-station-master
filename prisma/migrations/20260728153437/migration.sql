-- This migration originally ran before the Supplier module migration.
-- The column may exist in an already-developed database but will not yet
-- exist when the migration history is replayed in a clean shadow database.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Supplier'
      AND column_name = 'updatedAt'
  ) THEN
    ALTER TABLE "Supplier"
      ALTER COLUMN "updatedAt" DROP DEFAULT;
  END IF;
END
$$;