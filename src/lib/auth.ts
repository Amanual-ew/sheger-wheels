import type { NextAuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
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
const googleEnabled = !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/signin',
  },
  providers: [
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name ?? profile.email ?? 'Google User',
                email: profile.email,
                image: profile.picture,
                roles: ['renter'],
              }
            },
          }),
        ]
      : []),
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
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true

      const email = String(user.email ?? profile?.email ?? '').trim().toLowerCase()
      if (!email) return false

      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        if (existing.status === 'suspended') return false

        ;(user as any).id = existing.id
        ;(user as any).roles = JSON.parse(existing.roles || '["renter"]')
        ;(user as any).mustChangePassword = existing.mustChangePassword

        if (!existing.name && user.name) {
          await db.user.update({
            where: { id: existing.id },
            data: {
              name: user.name,
              avatarUrl: existing.avatarUrl || (user.image as string | null) || null,
            },
          })
        }

        return true
      }

      const created = await db.user.create({
        data: {
          email,
          name: user.name || 'Google User',
          avatarUrl: (user.image as string | null) || (profile as any)?.picture || null,
          roles: '["renter"]',
          status: 'active',
          mustChangePassword: false,
          passwordHash: null,
        },
      })

      ;(user as any).id = created.id
      ;(user as any).roles = ['renter']
      ;(user as any).mustChangePassword = false

      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = (user as any).id ?? token.id
        token.roles = (user as any).roles ?? JSON.parse((user as any).roles ?? '["renter"]')
        token.mustChangePassword = !!(user as any).mustChangePassword
      }

      if (account?.provider === 'google' && user?.email) {
        const dbUser = await db.user.findUnique({
          where: { email: String(user.email).toLowerCase() },
          select: { id: true, roles: true, status: true, mustChangePassword: true },
        })

        if (!dbUser || dbUser.status === 'suspended') {
          return {} as any
        }

        token.id = dbUser.id
        token.roles = JSON.parse(dbUser.roles || '["renter"]')
        token.mustChangePassword = dbUser.mustChangePassword
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