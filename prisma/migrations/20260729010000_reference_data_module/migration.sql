-- Reference Data module
-- Company-scoped categories with reusable values.

CREATE TABLE "ReferenceDataCategory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceDataCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReferenceDataValue" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceDataValue_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReferenceDataCategory_companyId_code_key"
    ON "ReferenceDataCategory"("companyId", "code");

CREATE INDEX "ReferenceDataCategory_companyId_isActive_idx"
    ON "ReferenceDataCategory"("companyId", "isActive");

CREATE INDEX "ReferenceDataCategory_companyId_nameEn_idx"
    ON "ReferenceDataCategory"("companyId", "nameEn");

CREATE UNIQUE INDEX "ReferenceDataValue_categoryId_code_key"
    ON "ReferenceDataValue"("categoryId", "code");

CREATE INDEX "ReferenceDataValue_categoryId_isActive_displayOrder_idx"
    ON "ReferenceDataValue"("categoryId", "isActive", "displayOrder");

CREATE INDEX "ReferenceDataValue_categoryId_isDefault_idx"
    ON "ReferenceDataValue"("categoryId", "isDefault");

ALTER TABLE "ReferenceDataCategory"
    ADD CONSTRAINT "ReferenceDataCategory_companyId_fkey"
    FOREIGN KEY ("companyId") REFERENCES "Company"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReferenceDataValue"
    ADD CONSTRAINT "ReferenceDataValue_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "ReferenceDataCategory"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
