'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'
import { getSafeReturnPath } from '@/lib/utils'

function dashboardFor(roles: unknown): string {
  const value = Array.isArray(roles) ? roles.join(',') : String(roles ?? '')
  if (value.includes('admin')) return '/admin'
  if (value.includes('owner')) return '/owner'
  return '/dashboard'
}

export function SignInClient() {
  const router = useRouter()
  const params = useSearchParams()

  const nextRaw = params.get('next')
  const safeNext = getSafeReturnPath(nextRaw)
  const isExternalBlocked = nextRaw !== null && safeNext === '/'
  const hasValidNext = nextRaw !== null && !isExternalBlocked

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [googlePending, setGooglePending] = useState(false)
  const [pending, startTransition] = useTransition()

  function doSignIn(emailToUse: string, passwordToUse: string) {
    startTransition(async () => {
      try {
        const res = await signIn('demo-credentials', {
          email: emailToUse.trim(),
          password: passwordToUse,
          redirect: false,
        })

        const errorText = typeof res?.error === 'string' ? res.error : String(res?.error ?? '')

        if (errorText) {
          if (errorText.includes('AccountSuspended')) {
            toast.error('This account is suspended. Please contact support.')
          } else {
            toast.error('Invalid email or password.')
          }
          return
        }

        if (!res?.ok) {
          toast.error('Unable to sign in. Please try again.')
          return
        }

        toast.success('Welcome back!')

        let destination = safeNext
        if (!hasValidNext) {
          const session = await getSession()
          destination = dashboardFor((session?.user as any)?.roles)
        }

        router.replace(destination)
        router.refresh()
      } catch {
        toast.error('Something went wrong. Please try again.')
      }
    })
  }

  function doGoogleSignIn() {
    setGooglePending(true)

    startTransition(async () => {
      try {
        await signIn('google', {
          callbackUrl: safeNext || '/dashboard',
          redirect: true,
        })
      } catch {
        toast.error('Unable to continue with Google. Please try again.')
      } finally {
        setGooglePending(false)
      }
    })
  }

  return (
    <div className="space-y-5">
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-lg text-base font-medium"
        onClick={doGoogleSignIn}
        disabled={pending || googlePending}
      >
        {googlePending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FcGoogle className="mr-2 h-4 w-4" />
        )}
        {googlePending ? 'Connecting...' : 'Continue with Google'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <span className="bg-card px-2">or</span>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          doSignIn(email, password)
        }}
        className="space-y-5"
      >
        {isExternalBlocked && (
          <p
            role="status"
            className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
          >
            The requested return address was not allowed. You&apos;ll be taken to your dashboard after signing in.
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">
            Email address
          </Label>

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-lg pl-10"
              required
              disabled={pending}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
          </div>

          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 rounded-lg pl-10 pr-12"
              required
              disabled={pending}
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 dark:hover:text-white"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              disabled={pending}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-lg text-base font-semibold"
          disabled={pending || !email.trim() || !password}
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <p className="text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
          Your account credentials are used to authenticate your session securely.
        </p>
      </form>
    </div>
  )
}