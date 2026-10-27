'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import {
  cancelBookingAction,
  startRentalAction, completeRentalAction, openDisputeAction,
} from '@/lib/actions/bookings'
import { OwnerBookingActions } from '@/app/owner/cars/[id]/bookings/owner-booking-actions'
import { toast } from 'sonner'
import {
  Loader2, X, CreditCard, Play, CheckCircle2, AlertTriangle, Map,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

type Booking = {
  id: string
  status: string
  paymentStatus: string
  startDate: string
  endDate: string
}

export function BookingActions({
  booking, isRenter, isOwner,
}: {
  booking: Booking
  isRenter: boolean
  isOwner: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [disputeOpen, setDisputeOpen] = useState(false)
  const [reason, setReason] = useState('damage')
  const [description, setDescription] = useState('')
  const router = useRouter()

  async function run<T>(fn: () => Promise<T>, successMsg: string) {
    startTransition(async () => {
      const res: any = await fn()
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success(successMsg)
      router.refresh()
    })
  }

  const hasActions =
    (isOwner && ['requested', 'confirmed', 'in_progress'].includes(booking.status)) ||
    (isRenter && ['requested', 'confirmed', 'completed'].includes(booking.status)) ||
    ['in_progress', 'confirmed', 'completed'].includes(booking.status)

  const awaitingPayment = booking.status === 'confirmed' && booking.paymentStatus === 'unpaid'

  return (
    <div className="space-y-2">
      {/* Owner: approve or decline a new request (same component as the Requests page) */}
      {isOwner && booking.status === 'requested' && (
        <div className="rounded-lg border bg-muted/40 p-2">
          <p className="mb-2 text-xs text-muted-foreground">
            Respond to this request
          </p>
          <OwnerBookingActions booking={booking as any} />
        </div>
      )}

      {/* Renter: waiting for the owner to approve */}
      {isRenter && booking.status === 'requested' && (
        <p className="rounded-lg border bg-muted/40 p-2 text-xs text-muted-foreground">
          Waiting for the owner to approve. You can pay once your request is approved.
        </p>
      )}

      {/* Renter: pay after the owner has approved */}
      {isRenter && awaitingPayment && (
        <Button asChild size="sm" className="w-full justify-start">
          <Link href={`/checkout?bookingId=${booking.id}`}>
            <CreditCard className="h-4 w-4 mr-1" /> Pay now (mock TeleBirr)
          </Link>
        </Button>
      )}

      {/* Owner: waiting for the renter to pay */}
      {isOwner && awaitingPayment && (
        <p className="rounded-lg border bg-muted/40 p-2 text-xs text-muted-foreground">
          Approved. Waiting for the renter to pay before you can start the rental.
        </p>
      )}

      {/* Renter: cancel */}
      {isRenter && (booking.status === 'requested' || booking.status === 'confirmed') && (
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => run(() => cancelBookingAction(booking.id), 'Booking cancelled')}
        >
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
          Cancel booking
        </Button>
      )}

      {/* Owner: start rental (only after the renter has paid) */}
      {isOwner && booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
        <Button
          size="sm"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => run(() => startRentalAction(booking.id), 'Rental started')}
        >
          <Play className="h-4 w-4 mr-1" /> Mark rental as started
        </Button>
      )}

      {/* Owner: complete rental */}
      {isOwner && booking.status === 'in_progress' && (
        <Button
          size="sm"
          className="w-full justify-start"
          disabled={pending}
          onClick={() => run(() => completeRentalAction(booking.id), 'Rental completed')}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" /> Mark rental complete
        </Button>
      )}

      {/* Renter: leave review */}
      {isRenter && booking.status === 'completed' && (
        <Button asChild size="sm" className="w-full justify-start">
          <Link href={`/bookings/${booking.id}/review`}>
            <CheckCircle2 className="h-4 w-4 mr-1" /> Leave a review
          </Link>
        </Button>
      )}

      {/* Both: track trip */}
      {(booking.status === 'in_progress' || booking.status === 'confirmed') && (
        <Button asChild variant="outline" size="sm" className="w-full justify-start">
          <Link href={`/bookings/${booking.id}/track`}>
            <Map className="h-4 w-4 mr-1" /> Track trip (simulation)
          </Link>
        </Button>
      )}

      {/* Both: open dispute */}
      {(isRenter || isOwner) &&
        ['in_progress', 'completed', 'confirmed'].includes(booking.status) && (
        <Dialog open={disputeOpen} onOpenChange={setDisputeOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-start text-orange-700">
              <AlertTriangle className="h-4 w-4 mr-1" /> Open dispute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open a dispute</DialogTitle>
              <DialogDescription>
                Describe the issue. An admin will review and resolve.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="reason">Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger id="reason"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="damage">Vehicle damage</SelectItem>
                    <SelectItem value="late_return">Late return</SelectItem>
                    <SelectItem value="payment">Payment issue</SelectItem>
                    <SelectItem value="misrepresentation">Car not as described</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide as much detail as possible..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisputeOpen(false)}>Cancel</Button>
              <Button
                disabled={pending || !description.trim()}
                onClick={() => {
                  startTransition(async () => {
                    const res = await openDisputeAction(booking.id, reason, description)
                    if (res.error) { toast.error(res.error); return }
                    toast.success('Dispute opened')
                    setDisputeOpen(false)
                    setDescription('')
                    router.refresh()
                  })
                }}
              >
                Submit dispute
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {!hasActions && (
        <p className="text-xs text-muted-foreground">No actions available right now.</p>
      )}

      <div className="text-xs text-muted-foreground pt-2 border-t mt-2">
        Current status: <StatusBadge status={booking.status} />
      </div>
    </div>
  )
}