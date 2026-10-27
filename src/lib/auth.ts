import type { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// Tell TypeScript that our session user has `id`, `roles` and `mustChangePassword`.
// Kept in this file so it is always part of the build.
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roles: string[]
      mustChangePassword: boolean
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    roles?: string[]
    mustChangePassword?: boolean
  }
}

/**
 * NextAuth configuration for Sheggar Wheels.
 *
 * Improvement over the original brief:
 *  - Real credential verification via bcrypt + DB lookup (replaces
 *    "demo card click" sign-in from the original frontend-only spec).
 *  - Session includes the user's role array so server components can
 *    perform role-aware rendering without an extra DB hit.
 *  - Suspended accounts cannot sign in (status check).
 *  - Accounts created by an admin must change their temporary password
 *    on first sign-in (mustChangePassword flag).
 *
 * Security note: this is demo-grade auth. The JWT secret lives in .env
 * and the database is SQLite. For production, swap to a real IdP, add
 * email verification, rate-limit the credentials endpoint, etc.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
  },
  providers: [
    CredentialsProvider({
      id: 'demo-credentials',
      name: 'Demo Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!ok) return null
        if (user.status === 'suspended') {
          // We still return null but the UI surfaces a clear message via the
          // error code below.
          throw new Error('AccountSuspended')
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          // stash roles so we can put them on the JWT below
          roles: JSON.parse(user.roles || '["renter"]'),
          mustChangePassword: user.mustChangePassword,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.roles = (user as any).roles ?? JSON.parse((user as any).roles ?? '["renter"]')
        token.mustChangePassword = !!(user as any).mustChangePassword
      }
      // Refresh suspended status on each JWT issuance so sign-out-by-suspend
      // takes effect on the next request.
      if (token.id) {
        const fresh = await db.user.findUnique({
          where: { id: token.id as string },
          select: { status: true, roles: true, mustChangePassword: true },
        })
        if (!fresh || fresh.status === 'suspended') {
          // Force sign-out by nuking the token
          return {} as any
        }
        token.roles = JSON.parse(fresh.roles || '["renter"]')
        token.mustChangePassword = fresh.mustChangePassword
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).roles = token.roles
        ;(session.user as any).mustChangePassword = !!token.mustChangePassword
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'sheggar-wheels-demo-secret-please-replace-in-production',
}

// Convenient helper types
export type AppSession = {
  user: {
    id: string
    email: string
    name: string
    roles: string[]
    mustChangePassword: boolean
  }
}