import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { notFound } from 'next/navigation'
import { ReviewForm } from './review-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { Star } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ReviewPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireUser()
  const booking = await db.booking.findUnique({
    where: { id },
    include: { car: true, review: true },
  })
  if (!booking) notFound()
  if (booking.renterId !== session.user.id) {
    notFound()
  }
  if (!['completed', 'reviewed'].includes(booking.status)) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="font-semibold mb-2">Review unavailable</h1>
            <p className="text-sm text-muted-foreground">
              You can only review completed bookings. This booking is{' '}
              <strong>{booking.status}</strong>.
            </p>
            <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline text-sm">
              Back to booking →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (booking.review) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" /> Your existing review
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p className="font-medium">Rating: {booking.review.rating} / 5</p>
            <p>{booking.review.comment}</p>
            {booking.review.ownerReply && (
              <div className="mt-2 pl-3 border-l">
                <p className="text-xs text-muted-foreground mb-1">Owner reply</p>
                <p>{booking.review.ownerReply}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground pt-2">
              You can only leave one review per booking.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Review your trip</h1>
        <p className="text-sm text-muted-foreground">
          {booking.car.make} {booking.car.model} · {formatDate(booking.startDate)} → {formatDate(booking.endDate)} · {formatETB(booking.total)}
        </p>
      </header>
      <ReviewForm bookingId={booking.id} carName={`${booking.car.make} ${booking.car.model}`} />
    </div>
  )
}
