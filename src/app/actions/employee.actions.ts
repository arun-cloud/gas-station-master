'use server'

import { prisma }         from '@/lib/prisma'
import { revalidatePath }  from 'next/cache'
import bcrypt              from 'bcryptjs'

// ── Add employee ────────────────────────────────────────
export async function addEmployee(formData: FormData) {
  const name     = formData.get('name')     as string
  const email    = formData.get('email')    as string
  const password = formData.get('password') as string
  const role     = formData.get('role')     as string

  if (!name || !email || !password || !role) {
    return { success: false, error: 'All fields are required' }
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return { success: false, error: 'Email already registered' }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role:     role as any,
        isActive: true,
      },
    })

    revalidatePath('/employees')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to add employee' }
  }
}

// ── Toggle employee active status ───────────────────────
export async function toggleEmployeeStatus(
  userId: string,
  isActive: boolean
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data:  { isActive },
    })
    revalidatePath('/employees')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update status' }
  }
}

// ── Clock in ────────────────────────────────────────────
export async function clockIn(userId: string, openingCash: number) {
  try {
    // Check no active shift already open
    const existing = await prisma.shift.findFirst({
      where: { userId, status: 'ACTIVE' },
    })
    if (existing) {
      return { success: false, error: 'Employee already has an active shift' }
    }

    await prisma.shift.create({
      data: {
        userId,
        startTime:   new Date(),
        openingCash,
        status:      'ACTIVE',
      },
    })

    revalidatePath('/employees')
    revalidatePath('/employees/shifts')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to clock in' }
  }
}

// ── Clock out ───────────────────────────────────────────
export async function clockOut(
  shiftId:     string,
  closingCash: number,
  notes:       string
) {
  try {
    await prisma.shift.update({
      where: { id: shiftId },
      data:  {
        endTime:     new Date(),
        closingCash,
        notes:       notes || null,
        status:      'CLOSED',
      },
    })

    revalidatePath('/employees')
    revalidatePath('/employees/shifts')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to clock out' }
  }
}

// ── Update employee role ─────────────────────────────────
export async function updateEmployeeRole(
  userId: string,
  role:   string
) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data:  { role: role as any },
    })
    revalidatePath('/employees')
    return { success: true }
  } catch {
    return { success: false, error: 'Failed to update role' }
  }
}