export type StationNozzleDto = {
  id: string
  dispenserNumber: number
  nozzleNumber: number
  fuelType: string
  currentReading: string
}

export type ActiveNozzleReadingDto = {
  id: string
  nozzleId: string
  dispenserNumber: number
  nozzleNumber: number
  fuelType: string
  openingReading: string
  unitPrice: string
  testLitres: string
  adjustmentLitres: string
}

export type BusinessDayDto = {
  id: string
  businessDate: string
  status: 'OPEN' | 'CLOSED'
  openedAt: string
  openedByName: string
  shiftCount: number
  totalLitres: string
  totalSalesAmount: string
}

export type ActiveStationShiftDto = {
  id: string
  shiftNumber: number
  status: 'OPEN'
  openedAt: string
  openedByName: string
  openingCash: string
  readings: ActiveNozzleReadingDto[]
}

export type RecentStationShiftDto = {
  id: string
  businessDate: string
  shiftNumber: number
  status: 'OPEN' | 'CLOSED' | 'EMERGENCY_CLOSED'
  openedAt: string
  closedAt: string | null
  openedByName: string
  closedByName: string | null
  meterSalesLitres: string
  meterSalesAmount: string
}

export type StationShiftPageData = {
  branch: {
    id: string
    nameEn: string
    branchCode: string
  } | null
  businessDay: BusinessDayDto | null
  activeShift: ActiveStationShiftDto | null
  nozzles: StationNozzleDto[]
  recentShifts: RecentStationShiftDto[]
}

export type StationShiftActionResult = {
  success: boolean
  error?: string
}
