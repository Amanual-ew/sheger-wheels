'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, X } from 'lucide-react'
import { formatDate } from '@/lib/format'

export function AvailabilityClient({
  carId, unavailable,
}: { carId: string; unavailable: string[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [dates, setDates] = useState<string[]>(unavailable)
  const [newDate, setNewDate] = useState('')

  function addDate() {
    if (!newDate) return
    if (dates.includes(newDate)) {
      toast.error('That date is already marked unavailable')
      return
    }
    const sorted = [...dates, newDate].sort()
    setDates(sorted)
    setNewDate('')
    save(sorted)
  }

  function removeDate(d: string) {
    const next = dates.filter((x) => x !== d)
    setDates(next)
    save(next)
  }

  function save(newDates: string[]) {
    startTransition(async () => {
      const res = await fetch(`/api/cars/${carId}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unavailableDates: newDates }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to update availability')
        return
      }
      toast.success('Availability updated')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Label htmlFor="newDate" className="text-xs">Add an unavailable date</Label>
          <Input
            id="newDate"
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
          />
        </div>
        <Button onClick={addDate} disabled={!newDate || pending}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
          Add
        </Button>
      </div>
      <div>
        {dates.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No unavailable dates. Your car is bookable every day.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {dates.map((d) => (
              <li key={d}>
                <Badge variant="secondary" className="flex items-center gap-1">
                  {formatDate(d)}
                  <button
                    onClick={() => removeDate(d)}
                    className="ml-1 hover:text-rose-600"
                    aria-label={`Remove ${d}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
