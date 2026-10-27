'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const STATUSES = [
  'all', 'requested', 'confirmed', 'in_progress', 'completed',
  'reviewed', 'declined', 'cancelled', 'disputed', 'resolved',
]

export function BookingFilters({ current }: { current: string }) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  function update(value: string) {
    startTransition(() => {
      const sp = new URLSearchParams(params.toString())
      if (value === 'all') sp.delete('status')
      else sp.set('status', value)
      router.push(`/bookings?${sp.toString()}`)
    })
  }

  return (
    <div className="mb-4 flex items-center gap-2 text-sm">
      <Label htmlFor="status" className="text-xs">Filter</Label>
      <Select value={current} onValueChange={update}>
        <SelectTrigger id="status" className="h-9 w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s === 'all' ? 'All statuses' : s.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <span className="text-xs text-muted-foreground">Updating...</span>}
    </div>
  )
}
