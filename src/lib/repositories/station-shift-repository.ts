import 'server-only'

import { prisma } from '@/lib/prisma'

export function findOpenBusinessDay(branchId: string) {
  return prisma.businessDay.findFirst({
    where: { branchId, status: 'OPEN' },
    include: {
      openedBy: { select: { name: true } },
      _count: { select: { shifts: true } },
    },
  })
}

export function findOpenStationShift(branchId: string) {
  return prisma.stationShift.findFirst({
    where: { branchId, status: 'OPEN' },
    include: {
      openedBy: { select: { name: true } },
      businessDay: { select: { businessDate: true } },
      readings: {
        include: {
          nozzle: {
            select: {
              id: true,
              nozzleNumber: true,
              fuelType: true,
              dispenser: { select: { dispenserNumber: true } },
            },
          },
        },
      },
    },
  })
}

export function findActiveNozzles(branchId: string) {
  return prisma.nozzle.findMany({
    where: {
      isActive: true,
      dispenser: {
        branchId,
        isActive: true,
      },
    },
    select: {
      id: true,
      nozzleNumber: true,
      fuelType: true,
      currentReading: true,
      dispenser: { select: { dispenserNumber: true } },
    },
  })
}

export function findRecentStationShifts(branchId: string, take = 20) {
  return prisma.stationShift.findMany({
    where: { branchId },
    take,
    orderBy: { openedAt: 'desc' },
    include: {
      businessDay: { select: { businessDate: true } },
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
  })
}
