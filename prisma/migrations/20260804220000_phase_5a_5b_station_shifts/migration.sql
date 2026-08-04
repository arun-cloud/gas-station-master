-- Phase 5A/5B: business days, station-level shifts and nozzle meter sales.

CREATE TYPE "BusinessDayStatus" AS ENUM ('OPEN', 'CLOSED');
CREATE TYPE "StationShiftStatus" AS ENUM ('OPEN', 'CLOSED', 'EMERGENCY_CLOSED');
CREATE TYPE "NozzleReadingStatus" AS ENUM ('OPEN', 'CLOSED');

CREATE TABLE "BusinessDay" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "businessDate" DATE NOT NULL,
    "status" "BusinessDayStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "openingNotes" TEXT,
    "closingNotes" TEXT,
    "totalLitres" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "totalSalesAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessDay_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StationShift" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "businessDayId" TEXT NOT NULL,
    "shiftNumber" INTEGER NOT NULL,
    "status" "StationShiftStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "openingCash" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "closingCash" DECIMAL(18,2),
    "meterSalesLitres" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "meterSalesAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "emergencyReason" TEXT,
    "openedById" TEXT NOT NULL,
    "closedById" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StationShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NozzleReading" (
    "id" TEXT NOT NULL,
    "stationShiftId" TEXT NOT NULL,
    "nozzleId" TEXT NOT NULL,
    "status" "NozzleReadingStatus" NOT NULL DEFAULT 'OPEN',
    "openingReading" DECIMAL(18,3) NOT NULL,
    "closingReading" DECIMAL(18,3),
    "unitPrice" DECIMAL(18,3) NOT NULL,
    "testLitres" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "adjustmentLitres" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "netSalesLitres" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "salesAmount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NozzleReading_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BusinessDay_branchId_businessDate_key"
    ON "BusinessDay"("branchId", "businessDate");
CREATE INDEX "BusinessDay_branchId_status_idx"
    ON "BusinessDay"("branchId", "status");
CREATE INDEX "BusinessDay_businessDate_idx"
    ON "BusinessDay"("businessDate");
CREATE UNIQUE INDEX "BusinessDay_one_open_per_branch"
    ON "BusinessDay"("branchId") WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX "StationShift_businessDayId_shiftNumber_key"
    ON "StationShift"("businessDayId", "shiftNumber");
CREATE INDEX "StationShift_branchId_status_idx"
    ON "StationShift"("branchId", "status");
CREATE INDEX "StationShift_businessDayId_status_idx"
    ON "StationShift"("businessDayId", "status");
CREATE INDEX "StationShift_openedAt_idx"
    ON "StationShift"("openedAt");
CREATE UNIQUE INDEX "StationShift_one_open_per_branch"
    ON "StationShift"("branchId") WHERE "status" = 'OPEN';

CREATE UNIQUE INDEX "NozzleReading_stationShiftId_nozzleId_key"
    ON "NozzleReading"("stationShiftId", "nozzleId");
CREATE INDEX "NozzleReading_nozzleId_idx"
    ON "NozzleReading"("nozzleId");
CREATE INDEX "NozzleReading_stationShiftId_status_idx"
    ON "NozzleReading"("stationShiftId", "status");

ALTER TABLE "BusinessDay"
    ADD CONSTRAINT "BusinessDay_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessDay"
    ADD CONSTRAINT "BusinessDay_openedById_fkey"
    FOREIGN KEY ("openedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessDay"
    ADD CONSTRAINT "BusinessDay_closedById_fkey"
    FOREIGN KEY ("closedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StationShift"
    ADD CONSTRAINT "StationShift_branchId_fkey"
    FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StationShift"
    ADD CONSTRAINT "StationShift_businessDayId_fkey"
    FOREIGN KEY ("businessDayId") REFERENCES "BusinessDay"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StationShift"
    ADD CONSTRAINT "StationShift_openedById_fkey"
    FOREIGN KEY ("openedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StationShift"
    ADD CONSTRAINT "StationShift_closedById_fkey"
    FOREIGN KEY ("closedById") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "NozzleReading"
    ADD CONSTRAINT "NozzleReading_stationShiftId_fkey"
    FOREIGN KEY ("stationShiftId") REFERENCES "StationShift"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "NozzleReading"
    ADD CONSTRAINT "NozzleReading_nozzleId_fkey"
    FOREIGN KEY ("nozzleId") REFERENCES "Nozzle"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
