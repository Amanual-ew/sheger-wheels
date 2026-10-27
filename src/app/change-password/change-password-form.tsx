'use client'

import { useState, useTransition } from 'react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Loader2, Eye, EyeOff, KeyRound, LogOut } from 'lucide-react'
import { changePasswordAction } from '@/lib/actions/account'

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [pending, startTransition] = useTransition()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const errs: Record<string, string> = {}
    if (!current) errs.current = 'Please enter your current password.'
    if (next.length < 8) errs.next = 'The new password must be at least 8 characters.'
    else if (next === current) errs.next = 'The new password must be different from the current one.'
    if (confirm !== next) errs.confirm = 'The passwords do not match.'

    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    startTransition(async () => {
      const res = await changePasswordAction(current, next)
      if (res.error) {
        setErrors({ form: res.error })
        toast.error(res.error)
        return
      }

      setCurrent('')
      setNext('')
      setConfirm('')

      if (forced) {
        // The old session still carries the "must change" flag, so sign out
        // and let the user sign in again with the new password.
        toast.success('Password changed. Please sign in with your new password.')
        await signOut({ callbackUrl: '/signin' })
        return
      }
      toast.success('Password changed')
    })
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
      aria-label={show ? 'Hide passwords' : 'Show passwords'}
      disabled={pending}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="current">{forced ? 'Temporary password' : 'Current password'}</Label>
        <div className="relative">
          <Input
            id="current"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="h-11 rounded-lg pr-12"
            disabled={pending}
            required
          />
          {toggle}
        </div>
        {errors.current && <p className="text-xs text-rose-600">{errors.current}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="next">New password</Label>
        <Input
          id="next"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-11 rounded-lg"
          disabled={pending}
          required
        />
        {errors.next && <p className="text-xs text-rose-600">{errors.next}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input
          id="confirm"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="h-11 rounded-lg"
          disabled={pending}
          required
        />
        {errors.confirm && <p className="text-xs text-rose-600">{errors.confirm}</p>}
      </div>

      {errors.form && (
        <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {errors.form}
        </p>
      )}

      <Button type="submit" className="h-11 w-full rounded-lg" disabled={pending}>
        {pending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <KeyRound className="mr-2 h-4 w-4" /> Change password
          </>
        )}
      </Button>

      {forced && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          disabled={pending}
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      )}
    </form>
  )
}