import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { Car } from 'lucide-react'
import { authOptions } from '@/lib/auth'
import { SignInClient } from './signin-client'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Sheggar Wheels account to manage car listings and bookings.',
}

export const dynamic = 'force-dynamic'

export default async function SignInPage() {
  const session = await getServerSession(authOptions)

  if (session?.user) {
    const roles = String((session.user as any).roles ?? '')
    if (roles.includes('admin')) redirect('/admin')
    if (roles.includes('owner')) redirect('/owner')
    redirect('/dashboard')
  }

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg">
            <Car className="h-8 w-8" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to continue to Sheggar Wheels.
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-xl shadow-primary/5 sm:p-8">
          <Suspense
            fallback={
              <div className="py-12 text-center text-sm text-muted-foreground">
                Loading sign-in form...
              </div>
            }
          >
            <SignInClient />
          </Suspense>

          <div className="mt-6 border-t pt-5 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              href="/signup"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By signing in, you agree to use Sheggar Wheels responsibly.
        </p>
      </div>
    </main>
  )
}