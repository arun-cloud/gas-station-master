import 'server-only'

import { Prisma } from '../../../prisma/generated/client'
import { resolveActiveBranch } from '@/lib/branch-context'
import { prisma } from '@/lib/prisma'
import {
  findActiveNozzles,
  findOpenBusinessDay,
  findOpenStationShift,
  findRecentStationShifts,
} from '@/lib/repositories/station-shift-repository'
import type {
  ActiveNozzleReadingDto,
  ActiveStationShiftDto,
  BusinessDayDto,
  RecentStationShiftDto,
  StationNozzleDto,
  StationShiftPageData,
} from '@/lib/station-shifts/types'
import type {
  CloseBusinessDayInput,
  CloseStationShiftInput,
  EmergencyCloseStationShiftInput,
  OpenBusinessDayInput,
  OpenStationShiftInput,
} from '@/lib/validation/station-shift.schema'

export class StationShiftDomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StationShiftDomainError'
  }
}

function decimal(value: string | number | Prisma.Decimal) {
  return new Prisma.Decimal(value)
}

function riyadhDateString(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)

  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value

  if (!year || !month || !day) {
    throw new StationShiftDomainError('Unable to resolve the current Riyadh business date')
  }

  return `${year}-${month}-${day}`
}

function asDatabaseDate(value?: string) {
  return new Date(`${value ?? riyadhDateString()}T00:00:00.000Z`)
}

function dateOnly(value: Date) {
  return value.toISOString().slice(0, 10)
}

function sortNozzles<T extends { dispenserNumber: number; nozzleNumber: number }>(rows: T[]) {
  return rows.sort(
    (left, right) =>
      left.dispenserNumber - right.dispenserNumber || left.nozzleNumber - right.nozzleNumber,
  )
}

export async function getStationShiftPageData(): Promise<StationShiftPageData> {
  const { activeBranch } = await resolveActiveBranch()

  if (!activeBranch) {
    return {
      branch: null,
      businessDay: null,
      activeShift: null,
      nozzles: [],
      recentShifts: [],
    }
  }

  const [businessDayRow, activeShiftRow, nozzleRows, recentRows] = await Promise.all([
    findOpenBusinessDay(activeBranch.id),
    findOpenStationShift(activeBranch.id),
    findActiveNozzles(activeBranch.id),
    findRecentStationShifts(activeBranch.id),
  ])

  const nozzles: StationNozzleDto[] = sortNozzles(
    nozzleRows.map(nozzle => ({
      id: nozzle.id,
      dispenserNumber: nozzle.dispenser.dispenserNumber,
      nozzleNumber: nozzle.nozzleNumber,
      fuelType: nozzle.fuelType,
      currentReading: nozzle.currentReading.toFixed(3),
    })),
  )

  const businessDay: BusinessDayDto | null = businessDayRow
    ? {
        id: businessDayRow.id,
        businessDate: dateOnly(businessDayRow.businessDate),
        status: businessDayRow.status,
        openedAt: businessDayRow.openedAt.toISOString(),
        openedByName: businessDayRow.openedBy.name,
        shiftCount: businessDayRow._count.shifts,
        totalLitres: businessDayRow.totalLitres.toFixed(3),
        totalSalesAmount: businessDayRow.totalSalesAmount.toFixed(2),
      }
    : null

  let activeShift: ActiveStationShiftDto | null = null

  if (activeShiftRow) {
    const readings: ActiveNozzleReadingDto[] = sortNozzles(
      activeShiftRow.readings.map(reading => ({
        id: reading.id,
        nozzleId: reading.nozzleId,
        dispenserNumber: reading.nozzle.dispenser.dispenserNumber,
        nozzleNumber: reading.nozzle.nozzleNumber,
        fuelType: reading.nozzle.fuelType,
        openingReading: reading.openingReading.toFixed(3),
        unitPrice: reading.unitPrice.toFixed(3),
        testLitres: reading.testLitres.toFixed(3),
        adjustmentLitres: reading.adjustmentLitres.toFixed(3),
      })),
    )

    activeShift = {
      id: activeShiftRow.id,
      shiftNumber: activeShiftRow.shiftNumber,
      status: 'OPEN',
      openedAt: activeShiftRow.openedAt.toISOString(),
      openedByName: activeShiftRow.openedBy.name,
      openingCash: activeShiftRow.openingCash.toFixed(2),
      readings,
    }
  }

  const recentShifts: RecentStationShiftDto[] = recentRows.map(shift => ({
    id: shift.id,
    businessDate: dateOnly(shift.businessDay.businessDate),
    shiftNumber: shift.shiftNumber,
    status: shift.status,
    openedAt: shift.openedAt.toISOString(),
    closedAt: shift.closedAt?.toISOString() ?? null,
    openedByName: shift.openedBy.name,
    closedByName: shift.closedBy?.name ?? null,
    meterSalesLitres: shift.meterSalesLitres.toFixed(3),
    meterSalesAmount: shift.meterSalesAmount.toFixed(2),
  }))

  return {
    branch: {
      id: activeBranch.id,
      nameEn: activeBranch.nameEn,
      branchCode: activeBranch.branchCode,
    },
    businessDay,
    activeShift,
    nozzles,
    recentShifts,
  }
}

export async function openBusinessDay(
  branchId: string,
  actorId: string,
  input: OpenBusinessDayInput,
) {
  const businessDate = asDatabaseDate(input.businessDate)

  return prisma.$transaction(
    async tx => {
      const openDay = await tx.businessDay.findFirst({
        where: { branchId, status: 'OPEN' },
        select: { businessDate: true },
      })

      if (openDay) {
        throw new StationShiftDomainError(
          `Business day ${dateOnly(openDay.businessDate)} is already open`,
        )
      }

      const existingDate = await tx.businessDay.findUnique({
        where: { branchId_businessDate: { branchId, businessDate } },
        select: { status: true },
      })

      if (existingDate) {
        throw new StationShiftDomainError(
          `Business day ${dateOnly(businessDate)} already exists with status ${existingDate.status}`,
        )
      }

      return tx.businessDay.create({
        data: {
          branchId,
          businessDate,
          openingNotes: input.openingNotes || null,
          openedById: actorId,
          createdBy: actorId,
          updatedBy: actorId,
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

export async function openStationShift(
  branchId: string,
  actorId: string,
  input: OpenStationShiftInput,
) {
  return prisma.$transaction(
    async tx => {
      const businessDay = await tx.businessDay.findFirst({
        where: { branchId, status: 'OPEN' },
        select: { id: true },
      })

      if (!businessDay) {
        throw new StationShiftDomainError('Open a business day before opening a station shift')
      }

      const existingShift = await tx.stationShift.findFirst({
        where: { branchId, status: 'OPEN' },
        select: { shiftNumber: true },
      })

      if (existingShift) {
        throw new StationShiftDomainError(`Station shift ${existingShift.shiftNumber} is already open`)
      }

      const activeNozzles = await tx.nozzle.findMany({
        where: { isActive: true, dispenser: { branchId, isActive: true } },
        select: { id: true, currentReading: true },
      })

      if (activeNozzles.length === 0) {
        throw new StationShiftDomainError('No active nozzles are configured for this branch')
      }

      const priceByNozzle = new Map(input.nozzlePrices.map(item => [item.nozzleId, item.unitPrice]))
      if (
        priceByNozzle.size !== activeNozzles.length ||
        activeNozzles.some(nozzle => !priceByNozzle.has(nozzle.id))
      ) {
        throw new StationShiftDomainError('A unit price is required for every active nozzle')
      }

      const latestShift = await tx.stationShift.aggregate({
        where: { businessDayId: businessDay.id },
        _max: { shiftNumber: true },
      })

      const shift = await tx.stationShift.create({
        data: {
          branchId,
          businessDayId: businessDay.id,
          shiftNumber: (latestShift._max.shiftNumber ?? 0) + 1,
          openingCash: decimal(input.openingCash),
          notes: input.notes || null,
          openedById: actorId,
          createdBy: actorId,
          updatedBy: actorId,
        },
      })

      await tx.nozzleReading.createMany({
        data: activeNozzles.map(nozzle => ({
          stationShiftId: shift.id,
          nozzleId: nozzle.id,
          openingReading: nozzle.currentReading,
          unitPrice: decimal(priceByNozzle.get(nozzle.id) ?? '0'),
          createdBy: actorId,
          updatedBy: actorId,
        })),
      })

      return shift
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

type CloseMode = 'NORMAL' | 'EMERGENCY'

async function closeShift(
  branchId: string,
  actorId: string,
  input: CloseStationShiftInput | EmergencyCloseStationShiftInput,
  mode: CloseMode,
) {
  return prisma.$transaction(
    async tx => {
      const shift = await tx.stationShift.findFirst({
        where: { id: input.shiftId, branchId, status: 'OPEN' },
        include: { readings: true },
      })

      if (!shift) throw new StationShiftDomainError('The open station shift was not found')

      const suppliedById = new Map(input.readings.map(item => [item.readingId, item]))
      if (
        suppliedById.size !== shift.readings.length ||
        shift.readings.some(reading => !suppliedById.has(reading.id))
      ) {
        throw new StationShiftDomainError('Closing readings are required for every shift nozzle')
      }

      let totalLitres = decimal(0)
      let totalAmount = decimal(0)

      for (const reading of shift.readings) {
        const supplied = suppliedById.get(reading.id)
        if (!supplied) throw new StationShiftDomainError('A nozzle closing reading is missing')

        const closingReading = decimal(supplied.closingReading)
        const testLitres = decimal(supplied.testLitres)
        const adjustmentLitres = decimal(supplied.adjustmentLitres)

        if (closingReading.lessThan(reading.openingReading)) {
          throw new StationShiftDomainError('Closing meter readings cannot be lower than opening readings')
        }

        const netSalesLitres = closingReading
          .minus(reading.openingReading)
          .minus(testLitres)
          .plus(adjustmentLitres)
          .toDecimalPlaces(3)

        if (netSalesLitres.isNegative()) {
          throw new StationShiftDomainError(
            'Test litres and adjustments cannot produce negative nozzle sales',
          )
        }

        const salesAmount = netSalesLitres.times(reading.unitPrice).toDecimalPlaces(2)

        await tx.nozzleReading.update({
          where: { id: reading.id },
          data: {
            status: 'CLOSED',
            closingReading,
            testLitres,
            adjustmentLitres,
            netSalesLitres,
            salesAmount,
            updatedBy: actorId,
          },
        })

        await tx.nozzle.update({
          where: { id: reading.nozzleId },
          data: { currentReading: closingReading, updatedBy: actorId },
        })

        totalLitres = totalLitres.plus(netSalesLitres)
        totalAmount = totalAmount.plus(salesAmount)
      }

      const emergencyReason =
        mode === 'EMERGENCY' && 'emergencyReason' in input ? input.emergencyReason : null

      return tx.stationShift.update({
        where: { id: shift.id },
        data: {
          status: mode === 'EMERGENCY' ? 'EMERGENCY_CLOSED' : 'CLOSED',
          closedAt: new Date(),
          closedById: actorId,
          closingCash: decimal(input.closingCash),
          meterSalesLitres: totalLitres.toDecimalPlaces(3),
          meterSalesAmount: totalAmount.toDecimalPlaces(2),
          notes: input.notes || shift.notes,
          emergencyReason,
          updatedBy: actorId,
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}

export function closeStationShift(branchId: string, actorId: string, input: CloseStationShiftInput) {
  return closeShift(branchId, actorId, input, 'NORMAL')
}

export function emergencyCloseStationShift(
  branchId: string,
  actorId: string,
  input: EmergencyCloseStationShiftInput,
) {
  return closeShift(branchId, actorId, input, 'EMERGENCY')
}

export async function closeBusinessDay(
  branchId: string,
  actorId: string,
  input: CloseBusinessDayInput,
) {
  return prisma.$transaction(
    async tx => {
      const businessDay = await tx.businessDay.findFirst({
        where: { id: input.businessDayId, branchId, status: 'OPEN' },
        include: { _count: { select: { shifts: true } } },
      })

      if (!businessDay) throw new StationShiftDomainError('The open business day was not found')

      const openShift = await tx.stationShift.findFirst({
        where: { businessDayId: businessDay.id, status: 'OPEN' },
        select: { id: true },
      })

      if (openShift) throw new StationShiftDomainError('Close the active station shift first')
      if (businessDay._count.shifts === 0) {
        throw new StationShiftDomainError('A business day cannot be closed without a station shift')
      }

      const totals = await tx.stationShift.aggregate({
        where: { businessDayId: businessDay.id },
        _sum: { meterSalesLitres: true, meterSalesAmount: true },
      })

      return tx.businessDay.update({
        where: { id: businessDay.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: actorId,
          closingNotes: input.closingNotes || null,
          totalLitres: totals._sum.meterSalesLitres ?? decimal(0),
          totalSalesAmount: totals._sum.meterSalesAmount ?? decimal(0),
          updatedBy: actorId,
        },
      })
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  )
}
