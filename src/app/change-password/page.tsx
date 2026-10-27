import type { Metadata } from 'next'
import { KeyRound } from 'lucide-react'
import { requireUser } from '@/lib/session'
import { ChangePasswordForm } from './change-password-form'

export const metadata: Metadata = { title: 'Change password' }
export const dynamic = 'force-dynamic'

export default async function ChangePasswordPage() {
  // allowMustChange: this page is where flagged accounts are sent.
  const session = await requireUser({ allowMustChange: true })
  const forced = session.user.mustChangePassword

  return (
    <main className="min-h-[calc(100dvh-4rem)] bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-5 sm:py-7">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
            <KeyRound className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {forced ? 'Set a new password' : 'Change password'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {forced
                ? 'Your account was created with a temporary password. Choose your own to continue.'
                : 'Choose a new password for your account.'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-lg shadow-primary/5 sm:p-6">
          <ChangePasswordForm forced={forced} />
        </div>
      </div>
    </main>
  )
}