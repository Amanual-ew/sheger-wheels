'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatETB } from '@/lib/format'
import { requestBookingAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { CalendarDays, LogIn, Loader2 } from 'lucide-react'

const PLATFORM_FEE_RATE = 0.10

export function BookingRequestForm({
  carId,
  pricePerDay,
  unavailableDates,
}: {
  carId: string
  pricePerDay: number
  unavailableDates: string[]
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [notes, setNotes] = useState('')

  const start = startDate ? new Date(startDate) : null
  const end = endDate ? new Date(endDate) : null
  let days = 0
  if (start && end) {
    days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
  }
  const subtotal = days * pricePerDay
  const fee = subtotal * PLATFORM_FEE_RATE
  const total = subtotal + fee

  const overlapsUnavailable = !!(
    start &&
    end &&
    unavailableDates.some((d) => {
      const u = new Date(d)
      return u >= start && u <= end
    })
  )

  const invalidDates = !start || !end || end.getTime() < start.getTime()
  const isOwner = !!session?.user?.roles?.includes('owner')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status !== 'authenticated') {
      const next = `/cars/${carId}`
      router.push(`/signin?next=${encodeURIComponent(next)}`)
      return
    }
    if (invalidDates) {
      toast.error('Please pick a valid date range.')
      return
    }
    if (overlapsUnavailable) {
      toast.error('Selected dates include an unavailable date.')
      return
    }
    startTransition(async () => {
      const result = await requestBookingAction(carId, startDate, endDate, notes)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Booking requested! Taking you to checkout...')
      if (result.bookingId) {
        router.push(`/checkout?bookingId=${result.bookingId}`)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="startDate" className="text-xs">Pick up</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="h-9 mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate" className="text-xs">Return</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="h-9 mt-1"
            required
          />
        </div>
      </div>

      {days > 0 && !invalidDates && !overlapsUnavailable && (
        <div className="bg-muted/50 rounded-md p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span>{formatETB(pricePerDay)} × {days} day{days === 1 ? '' : 's'}</span>
            <span>{formatETB(subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform fee (10%)</span>
            <span>{formatETB(fee)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total</span>
            <span>{formatETB(total)}</span>
          </div>
        </div>
      )}

      {overlapsUnavailable && (
        <p className="text-xs text-rose-600">
          One of the selected dates is unavailable. Please choose different dates.
        </p>
      )}

      <div>
        <Label htmlFor="notes" className="text-xs">Notes (optional)</Label>
        <Input
          id="notes"
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pickup time, flight number, etc."
          className="h-9 mt-1"
          maxLength={200}
        />
      </div>

      {status === 'authenticated' && isOwner && (
        <p className="text-xs text-muted-foreground">
          You have an owner account. You can still book cars as a renter — your
          account supports both roles.
        </p>
      )}

      <Button
        type="submit"
        disabled={pending || invalidDates || overlapsUnavailable}
        className="w-full"
      >
        {pending ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Requesting...</>
        ) : status !== 'authenticated' ? (
          <><LogIn className="h-4 w-4 mr-1" /> Sign in to request</>
        ) : (
          <><CalendarDays className="h-4 w-4 mr-1" /> Request booking</>
        )}
      </Button>
    </form>
  )
}