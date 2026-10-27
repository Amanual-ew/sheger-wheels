'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, UserPlus } from 'lucide-react'

export function SignUpClient() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedPhone = phone.trim()

    if (!normalizedName) {
      newErrors.name = 'Please enter your full name.'
    }

    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(normalizedEmail)) {
      newErrors.email = 'Please enter a valid email address.'
    }

    if (
      normalizedPhone &&
      !/^\+?[0-9\s-]{6,20}$/.test(normalizedPhone)
    ) {
      newErrors.phone = 'Please enter a valid phone number.'
    }

    if (password.length < 8) {
      newErrors.password =
        'Your password must contain at least 8 characters.'
    }

    setErrors(newErrors)

    if (Object.keys(newErrors).length > 0) return

    startTransition(async () => {
      try {
        const res = await fetch('/api/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: normalizedName,
            email: normalizedEmail,
            phone: normalizedPhone,
            password,
          }),
        })

        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          const message =
            data.error ||
            'We could not create your account. Please try again.'

          setErrors({ form: message })
          toast.error(message)
          return
        }

        const signRes = await signIn('demo-credentials', {
          email: normalizedEmail,
          password,
          redirect: false,
        })

        if (signRes?.error || !signRes?.ok) {
          toast.success('Your account was created. Please sign in.')
          router.push('/signin')
          router.refresh()
          return
        }

        toast.success('Welcome to Sheggar Wheels!')
        router.replace('/dashboard')
        router.refresh()
      } catch {
        const message =
          'Unable to connect to the server. Please try again.'

        setErrors({ form: message })
        toast.error(message)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <UserPlus className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-semibold text-slate-900 dark:text-white">
            Your details
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Create your personal renter account.
          </p>
        </div>
      </div>

      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-lg"
          required
          disabled={pending}
        />
        {errors.name && (
          <p className="text-xs text-rose-600">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11 rounded-lg"
          required
          disabled={pending}
        />
        {errors.email && (
          <p className="text-xs text-rose-600">{errors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone number{' '}
          <span className="font-normal text-slate-500">
            (optional)
          </span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+251 911 234 567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="h-11 rounded-lg"
          disabled={pending}
        />
        {errors.phone && (
          <p className="text-xs text-rose-600">{errors.phone}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>

        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-lg pr-12"
            minLength={8}
            required
            disabled={pending}
          />

          <button
            type="button"
            onClick={() =>
              setShowPassword((current) => !current)
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 dark:hover:text-white"
            aria-label={
              showPassword ? 'Hide password' : 'Show password'
            }
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

        {errors.password && (
          <p className="text-xs text-rose-600">
            {errors.password}
          </p>
        )}
      </div>

      {/* Server errors */}
      {errors.form && (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300"
        >
          {errors.form}
        </p>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="h-11 w-full rounded-lg bg-orange-500 text-base font-semibold text-slate-950 hover:bg-orange-600"
        disabled={pending}
      >
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Create account
          </>
        )}
      </Button>

      <p className="pt-1 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
        Your account will be created with the renter role by default.
      </p>
    </form>
  )
}