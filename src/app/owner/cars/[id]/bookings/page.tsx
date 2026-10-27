import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { OwnerNav } from '@/components/owner-nav'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { Inbox } from 'lucide-react'
import { OwnerBookingActions } from './owner-booking-actions'

export const dynamic = 'force-dynamic'

export default async function OwnerCarBookingsPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await requireRole('owner')
  const { id } = await params
  const car = await db.car.findUnique({ where: { id } })
  if (!car || car.ownerId !== session.user.id) notFound()

  const bookings = await db.booking.findMany({
    where: { carId: id },
    include: { renter: { select: { name: true, email: true } } },
    orderBy: { startDate: 'desc' },
  })

  const pending = bookings.filter((b) => b.status === 'requested')

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Requests — {car.make} {car.model}</h1>
        <p className="text-sm text-muted-foreground">
          Review and respond to booking requests for this car.
        </p>
      </header>
      <OwnerNav />

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-semibold mb-1">No requests yet</h2>
            <p className="text-sm text-muted-foreground">
              Booking requests from renters will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pending.length > 0 && (
            <Card className="mb-4 border-l-4 border-l-amber-500">
              <CardContent className="p-3 text-sm">
                <strong>{pending.length}</strong> pending request{pending.length === 1 ? '' : 's'} awaiting your response.
              </CardContent>
            </Card>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Renter</th>
                  <th className="py-2 pr-3">Dates</th>
                  <th className="py-2 pr-3">Total</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Booked</th>
                  <th className="py-2 pr-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-3 pr-3">
                      <p className="font-medium">{b.renter.name}</p>
                      <p className="text-xs text-muted-foreground">{b.renter.email}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <p>{formatDate(b.startDate)}</p>
                      <p className="text-xs text-muted-foreground">→ {formatDate(b.endDate)}</p>
                    </td>
                    <td className="py-3 pr-3">{formatETB(b.total)}</td>
                    <td className="py-3 pr-3"><StatusBadge status={b.status} /></td>
                    <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDate(b.createdAt)}</td>
                    <td className="py-3 pr-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/bookings/${b.id}`}>View</Link>
                        </Button>
                        <OwnerBookingActions booking={JSON.parse(JSON.stringify(b))} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
