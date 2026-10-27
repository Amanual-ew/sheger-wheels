import Link from 'next/link'
import type { Metadata } from 'next'
import { Car } from 'lucide-react'
import { SignUpClient } from './signup-client'

export const metadata: Metadata = {
  title: 'Sign up',
  description:
    'Create your Sheggar Wheels account to explore cars and request rentals.',
}

export default function SignUpPage() {
  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-5 sm:py-7">
      <div className="mx-auto w-full max-w-md">
        {/* Logo and heading */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
            <Car className="h-6 w-6" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Welcome to Sheggar Wheels.
            </p>
          </div>
        </div>

        {/* Registration card */}
        <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5 sm:p-6">
          <SignUpClient />

          <div className="mt-4 border-t pt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              href="/signin"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}