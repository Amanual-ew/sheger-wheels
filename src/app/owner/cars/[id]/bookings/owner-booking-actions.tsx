'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { respondToBookingAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

type Booking = { id: string; status: string }

export function OwnerBookingActions({ booking }: { booking: Booking }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  if (booking.status !== 'requested') return null

  function respond(action: 'approve' | 'decline') {
    startTransition(async () => {
      const res = await respondToBookingAction(booking.id, action)
      if (res.error) { toast.error(res.error); return }
      toast.success(action === 'approve' ? 'Booking approved' : 'Booking declined')
      router.refresh()
    })
  }

  return (
    <>
      <Button
        size="sm"
        variant="default"
        disabled={pending}
        onClick={() => respond('approve')}
        title="Approve"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() => respond('decline')}
        title="Decline"
      >
        <X className="h-3 w-3" />
      </Button>
    </>
  )
}
