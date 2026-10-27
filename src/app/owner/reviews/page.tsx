import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OwnerNav } from '@/components/owner-nav'
import { formatDate } from '@/lib/format'
import { Star } from 'lucide-react'
import { ReviewReplyForm } from './review-reply-form'
import Link from 'next/link'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerReviewsPage() {
  const session = await requireRole('owner')
  const ownerId = session.user.id

  // All reviews across the owner's cars, newest first.
  const reviews = await db.review.findMany({
    where: { ownerId },
    include: {
      renter: { select: { name: true } },
      car: { select: { make: true, model: true, id: true } },
      booking: { select: { startDate: true, endDate: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
    : null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">
            {reviews.length} review{reviews.length === 1 ? '' : 's'}
            {avg ? ` · ${avg}★ average` : ''}
          </p>
        </div>
      </header>
      <OwnerNav />

      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-semibold mb-1">No reviews yet</h2>
            <p className="text-sm text-muted-foreground">
              Reviews will appear here once renters complete trips.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`}
                        />
                      ))}
                    </div>
                    <Link href={`/cars/${r.car.id}`} className="text-sm font-medium hover:text-primary">
                      {r.car.make} {r.car.model}
                    </Link>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm">{r.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Trip: {formatDate(r.booking.startDate)} → {formatDate(r.booking.endDate)}
                  </p>
                  {r.ownerReply ? (
                    <div className="mt-2 ml-4 pl-3 border-l text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Your reply</p>
                      <p>{r.ownerReply}</p>
                    </div>
                  ) : (
                    <ReviewReplyForm reviewId={r.id} />
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
