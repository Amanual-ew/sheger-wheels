import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

// Must be the same secret as `authOptions.secret` in lib/auth.ts.
const SECRET =
  process.env.NEXTAUTH_SECRET || 'sheggar-wheels-demo-secret-please-replace-in-production'

/**
 * Next.js 16 calls this file "proxy" (it used to be "middleware"), and the
 * exported function must be named `proxy`.
 *
 * While an account still has a temporary password (mustChangePassword),
 * every page redirects to /change-password. The server-side helpers in
 * lib/session.ts enforce the same rule with fresh data from the database;
 * this proxy just makes sure no page, including public ones, can be
 * browsed in the meantime.
 */
export async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: SECRET })

  if (token?.mustChangePassword && !req.nextUrl.pathname.startsWith('/change-password')) {
    return NextResponse.redirect(new URL('/change-password', req.url))
  }

  return NextResponse.next()
}

export const config = {
  // Skip API routes (incl. /api/auth for sign-out), Next internals and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}