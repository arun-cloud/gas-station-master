'use server'

import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type RegisterActionResult = {
  success: boolean
  error?: string
}

/**
 * Self-registration entry point. Anyone can call this — that's by design.
 * Security boundary: role and isActive are NEVER taken from client input.
 * Every self-registered account starts as CASHIER and inactive, and must
 * be activated (with a role + branch assignment) by an ADMIN or MANAGER
 * via /admin/users before they can sign in.
 */
export async function registerUser(
  formData: FormData,
): Promise<RegisterActionResult> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Invalid input',
    }
  }

  const { name, email, password } = parsed.data

  try {
    const existing = await prisma.user.findUnique({ where: { email } })

    if (existing) {
      return {
        success: false,
        error: 'An account with this email already exists',
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CASHIER',
        isActive: false,
      },
    })

    return { success: true }
  } catch (error: unknown) {
    console.error('Failed to register user:', error)
    return {
      success: false,
      error: 'Failed to create account. Please try again.',
    }
  }
}
