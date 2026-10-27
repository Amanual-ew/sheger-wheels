'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Loader2, Eye, EyeOff, UserPlus, Wand2, Copy, CheckCircle2,
} from 'lucide-react'
import { adminCreateUserAction } from '@/lib/actions/admin-users'

const ROLE_OPTIONS = [
  { value: 'renter', label: 'Renter', hint: 'Can browse cars and request bookings.' },
  { value: 'owner', label: 'Owner', hint: 'Can list cars and respond to booking requests.' },
] as const

// Random password without look-alike characters (0/O, 1/l/I).
function generatePassword(length = 12) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  const bytes = new Uint32Array(length)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (n) => alphabet[n % alphabet.length]).join('')
}

type Created = { email: string; password: string; roles: string[] }

export function NewUserForm() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [roles, setRoles] = useState<string[]>(['renter'])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [created, setCreated] = useState<Created | null>(null)

  function toggleRole(role: string) {
    setRoles((cur) => (cur.includes(role) ? cur.filter((r) => r !== role) : [...cur, role]))
  }

  function reset() {
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
    setShowPassword(false)
    setRoles(['renter'])
    setErrors({})
    setCreated(null)
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${label} copied`)
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.')
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const next: Record<string, string> = {}
    const n = name.trim()
    const em = email.trim().toLowerCase()
    const ph = phone.trim()

    if (!n) next.name = 'Please enter the full name.'
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) next.email = 'Please enter a valid email address.'
    if (ph && !/^\+?[0-9\s-]{6,20}$/.test(ph)) next.phone = 'Please enter a valid phone number.'
    if (password.length < 8) next.password = 'The password must be at least 8 characters.'
    if (roles.length === 0) next.roles = 'Choose at least one role.'

    setErrors(next)
    if (Object.keys(next).length > 0) return

    startTransition(async () => {
      const res = await adminCreateUserAction({
        name: n, email: em, phone: ph, password, roles,
      })
      if (res.error) {
        setErrors({ form: res.error })
        toast.error(res.error)
        return
      }
      toast.success('User created')
      setCreated({ email: em, password, roles })
      router.refresh()
    })
  }

  // Success state: show the credentials so the admin can pass them on.
  if (created) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" />
          <h2 className="font-semibold">Account created</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Share these sign-in details with the user. The password is not shown again.
        </p>

        <div className="space-y-2 rounded-lg border bg-muted/40 p-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="truncate font-medium">{created.email}</p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => copy(created.email, 'Email')}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Password</p>
              <code className="break-all font-medium">{created.password}</code>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => copy(created.password, 'Password')}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Roles</p>
            <p className="font-medium capitalize">{created.roles.join(' · ')}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={reset}>
            <UserPlus className="mr-1 h-4 w-4" /> Add another user
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">Back to users</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Full name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter the full name"
          disabled={pending}
          required
        />
        {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
      </div>

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="user@example.com"
          disabled={pending}
          required
        />
        {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
      </div>

      {/* Phone */}
      <div className="space-y-1.5">
        <Label htmlFor="phone">
          Phone number <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+251 911 234 567"
          disabled={pending}
        />
        {errors.phone && <p className="text-xs text-rose-600">{errors.phone}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pr-10"
              disabled={pending}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={pending}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => {
              setPassword(generatePassword())
              setShowPassword(true)
            }}
          >
            <Wand2 className="mr-1 h-4 w-4" /> Generate
          </Button>
        </div>
        {errors.password && <p className="text-xs text-rose-600">{errors.password}</p>}
      </div>

      {/* Roles */}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Roles</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => {
            const checked = roles.includes(r.value)
            return (
              <label
                key={r.value}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                  checked ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
                  checked={checked}
                  onChange={() => toggleRole(r.value)}
                  disabled={pending}
                />
                <span>
                  <span className="block text-sm font-medium">{r.label}</span>
                  <span className="block text-xs text-muted-foreground">{r.hint}</span>
                </span>
              </label>
            )
          })}
        </div>
        {errors.roles && <p className="text-xs text-rose-600">{errors.roles}</p>}
      </fieldset>

      {errors.form && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {errors.form}
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" /> Create user
            </>
          )}
        </Button>
        <Button asChild variant="outline" disabled={pending}>
          <Link href="/admin/users">Cancel</Link>
        </Button>
      </div>
    </form>
  )
}