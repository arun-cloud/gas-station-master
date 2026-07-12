import type { Role } from '../../prisma/generated/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: Role
      isActive: boolean
      branchIds: string[]
    }
  }

  interface User {
    id: string
    name: string
    email: string
    role: Role
    isActive: boolean
    branchIds: string[]
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    isActive: boolean
    branchIds: string[]
  }
}
