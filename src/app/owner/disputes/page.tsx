import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { OwnerNav } from '@/components/owner-nav'
import { formatDate, formatDateTime } from '@/lib/format'
import Link from 'next/link'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerDisputesPage() {
  const session = await requireRole('owner')
  const ownerId = session.user.id

  // Disputes where the owner is a party (i.e. the dispute is on a booking on one of the owner's cars).
  const disputes = await db.dispute.findMany({
    where: {
      booking: { ownerId },
    },
    include: {
      booking: {
        include: {
          renter: { select: { name: true } },
          car: { select: { make: true, model: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Disputes opened on bookings involving your cars.
        </p>
      </header>
      <OwnerNav />

      {disputes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-semibold mb-1">No disputes to review</h2>
            <p className="text-sm text-muted-foreground">
              Disputes opened on your bookings will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {disputes.map((d) => (
            <li key={d.id}>
              <Card className={d.status === 'open' ? 'border-l-4 border-l-orange-500' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {d.booking.car.make} {d.booking.car.model} · {d.booking.renter.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Opened {formatDateTime(d.createdAt)} · Reason:{' '}
                        <span className="capitalize">{d.reason.replace('_', ' ')}</span>
                      </p>
                      <p className="text-sm mt-2">{d.description}</p>
                      {d.resolutionNotes && (
                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-sm">
                          <p className="text-xs text-muted-foreground mb-1">Admin resolution</p>
                          <p>{d.resolutionNotes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={d.status} />
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/bookings/${d.bookingId}`}>View booking</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
