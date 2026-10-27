import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = { status?: string }

export default async function AdminBookingsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  await requireRole('admin')
  const sp = await searchParams
  const statusFilter = sp.status

  const where: any = {}
  if (statusFilter) where.status = statusFilter

  const bookings = await db.booking.findMany({
    where,
    include: {
      car: { select: { make: true, model: true, id: true } },
      renter: { select: { name: true, email: true } },
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">All bookings</h1>
        <p className="text-sm text-muted-foreground">
          {bookings.length} booking{bookings.length === 1 ? '' : 's'} (max 200 shown).
        </p>
      </header>

      <div className="mb-4 flex gap-1 flex-wrap text-xs">
        {['all', 'requested', 'confirmed', 'in_progress', 'completed', 'reviewed', 'cancelled', 'disputed', 'resolved'].map((s) => (
          <Button key={s} asChild size="sm" variant={(statusFilter ?? 'all') === s ? 'default' : 'outline'}>
            <Link href={s === 'all' ? '/admin/bookings' : `/admin/bookings?status=${s}`} className="capitalize">
              {s.replace('_', ' ')}
            </Link>
          </Button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No bookings found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Car</th>
                <th className="py-2 pr-3">Renter</th>
                <th className="py-2 pr-3">Owner</th>
                <th className="py-2 pr-3">Dates</th>
                <th className="py-2 pr-3">Total</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Payment</th>
                <th className="py-2 pr-3 text-right">View</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 pr-3">
                    <Link href={`/cars/${b.car.id}`} className="font-medium hover:text-primary">
                      {b.car.make} {b.car.model}
                    </Link>
                  </td>
                  <td className="py-3 pr-3">
                    <p>{b.renter.name}</p>
                    <p className="text-xs text-muted-foreground">{b.renter.email}</p>
                  </td>
                  <td className="py-3 pr-3">{b.owner.name}</td>
                  <td className="py-3 pr-3">
                    <p>{formatDate(b.startDate)}</p>
                    <p className="text-xs text-muted-foreground">→ {formatDate(b.endDate)}</p>
                  </td>
                  <td className="py-3 pr-3">{formatETB(b.total)}</td>
                  <td className="py-3 pr-3"><StatusBadge status={b.status} /></td>
                  <td className="py-3 pr-3"><StatusBadge status={b.paymentStatus} /></td>
                  <td className="py-3 pr-3 text-right">
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/bookings/${b.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}