import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { Download, CalendarDays, Inbox } from 'lucide-react'
import { BookingFilters } from './booking-filters'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My bookings',
}

type SearchParams = {
  status?: string
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const session = await requireUser()
  const sp = await searchParams
  const statusFilter = sp.status

  const where: any = { renterId: session.user.id }
  if (statusFilter) where.status = statusFilter

  const bookings = await db.booking.findMany({
    where,
    include: { car: true },
    orderBy: { startDate: 'desc' },
  })

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My bookings</h1>
          <p className="text-sm text-muted-foreground">
            {bookings.length} booking{bookings.length === 1 ? '' : 's'} ·
            Export to CSV for record-keeping.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href="/api/export/bookings.csv">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </a>
        </Button>
      </header>

      <BookingFilters current={statusFilter ?? 'all'} />

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-semibold mb-1">
              {statusFilter ? `No ${statusFilter} bookings` : 'You have no bookings yet'}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Browse cars and request your first booking to see it here.
            </p>
            <Button asChild>
              <Link href="/cars">Browse cars</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="card-hover">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link href={`/cars/${b.carId}`} className="font-semibold hover:text-primary">
                        {b.car.make} {b.car.model}
                      </Link>
                      <StatusBadge status={b.status} />
                      <StatusBadge status={b.paymentStatus} />
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                      <CalendarDays className="h-3 w-3" />
                      {formatDate(b.startDate)} → {formatDate(b.endDate)} · {b.days} day{b.days === 1 ? '' : 's'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.car.neighbourhood} · {formatETB(b.total)} total
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {b.status === 'completed' && (
                      <Button asChild size="sm" variant="default">
                        <Link href={`/bookings/${b.id}/review`}>Leave review</Link>
                      </Button>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bookings/${b.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
