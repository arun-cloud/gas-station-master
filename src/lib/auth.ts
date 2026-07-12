import './env'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 60 * 60 * 8, // 8 hours
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase().trim() },
          include: {
            userBranches: { select: { branchId: true } },
          },
        })

        if (!user) {
          throw new Error('Invalid email or password')
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        )

        if (!passwordValid) {
          throw new Error('Invalid email or password')
        }

        if (!user.isActive) {
          throw new Error(
            'Your account is pending activation by an administrator',
          )
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          branchIds: user.userBranches.map((ub) => ub.branchId),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.isActive = user.isActive
        token.branchIds = user.branchIds
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.isActive = token.isActive
      session.user.branchIds = token.branchIds
      return session
    },
  },
}
