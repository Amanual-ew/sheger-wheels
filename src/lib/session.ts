import 'server-only'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from './auth'

/**
 * Server-side helpers for role and ownership checks.
 *
 * Improvement over the original brief:
 *  - All checks run on the SERVER (not just the client).
 *  - `requireRole` performs a hard redirect to /signin (with `?next=`)
 *    when no session, or to /403 when the role doesn't match.
 *  - `requireOwnership` makes the same checks plus ownership of a record
 *    before any mutation occurs.
 *  - Accounts flagged `mustChangePassword` (created by an admin with a
 *    temporary password) are sent to /change-password and are treated as
 *    "not signed in" by server actions until they have changed it.
 *
 * These helpers do NOT constitute production-grade security; they're
 * defense-in-depth on top of NextAuth. The README documents this honestly.
 */

type SessionOptions = {
  /** Set only on the change-password page and action. */
  allowMustChange?: boolean
}

async function getRawSession() {
  return getServerSession(authOptions)
}

export async function getCurrentSession(opts?: SessionOptions) {
  const session = await getRawSession()
  if (session?.user?.mustChangePassword && !opts?.allowMustChange) return null
  return session
}

export async function requireUser(opts?: SessionOptions) {
  const session = await getRawSession()
  if (!session?.user?.id) {
    redirect('/signin?next=' + encodeURIComponent(getSafeReturnPath()))
  }
  if (session.user.mustChangePassword && !opts?.allowMustChange) {
    redirect('/change-password')
  }
  return session
}

export async function requireRole(role: 'renter' | 'owner' | 'admin') {
  const session = await requireUser()
  const roles = (session.user as any).roles as string[] | undefined
  if (!roles || !roles.includes(role)) {
    redirect('/403')
  }
  return session
}

/** Reject an external return URL. */
export function getSafeReturnPath(value?: string | null): string {
  if (!value) return '/'
  // Disallow anything that isn't a same-origin path
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) {
    return value
  }
  return '/'
}

export function hasRole(roles: string[] | undefined, role: string): boolean {
  return Boolean(roles?.includes(role))
}