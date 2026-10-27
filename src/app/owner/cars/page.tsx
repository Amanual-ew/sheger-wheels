import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { OwnerNav } from '@/components/owner-nav'
import { formatETB, formatDate, relativeTime } from '@/lib/format'
import Link from 'next/link'
import {
  PlusCircle, Inbox, Pencil, CalendarCheck, Eye, BellRing,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerCarsPage() {
  const session = await requireRole('owner')
  const ownerId = session.user.id

  const [cars, requests] = await Promise.all([
    db.car.findMany({
      where: { ownerId },
      include: {
        _count: {
          select: {
            bookings: true,
          },
        },
        bookings: {
          where: { status: 'requested' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.booking.findMany({
      where: { ownerId, status: 'requested' },
      include: {
        car: { select: { id: true, make: true, model: true } },
        renter: { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">My cars</h1>
          <p className="text-sm text-muted-foreground">{cars.length} car{cars.length === 1 ? '' : 's'} listed</p>
        </div>
        <Button asChild>
          <Link href="/owner/cars/new">
            <PlusCircle className="h-4 w-4 mr-1" /> List a car
          </Link>
        </Button>
      </header>

      <OwnerNav />

      {/* Booking requests */}
      {requests.length > 0 && (
        <Card className="mb-6 border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BellRing className="h-4 w-4 text-accent" />
              Booking requests
              <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-white">
                {requests.length}
              </span>
            </CardTitle>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Waiting for your answer
            </p>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">
                      {r.renter.name}{' '}
                      <span className="font-normal text-muted-foreground">
                        wants the {r.car.make} {r.car.model}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.startDate)} → {formatDate(r.endDate)} · {r.days} day{r.days === 1 ? '' : 's'} · {formatETB(r.total)}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Requested {relativeTime(r.createdAt)}
                      {r.renter.phone ? ` · ${r.renter.phone}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                  <Button asChild size="sm">
                    <Link href={`/bookings/${r.id}`}>Review</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {cars.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h2 className="font-semibold mb-1">You haven't listed any cars yet</h2>
            <p className="text-sm text-muted-foreground mb-4">
              List your first car to start receiving booking requests.
            </p>
            <Button asChild>
              <Link href="/owner/cars/new">List a car</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Car</th>
                <th className="py-2 pr-3">Price/day</th>
                <th className="py-2 pr-3">Neighbourhood</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Bookings</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 pr-3">
                    <Link href={`/cars/${c.id}`} className="font-medium hover:text-primary">
                      {c.make} {c.model}
                    </Link>
                    <p className="text-xs text-muted-foreground">{c.year} · {c.seats} seats · {c.transmission}</p>
                  </td>
                  <td className="py-3 pr-3">{formatETB(c.pricePerDay)}</td>
                  <td className="py-3 pr-3">{c.neighbourhood}</td>
                  <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-3">{c._count.bookings}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="py-3 pr-3 text-right">
                    <div className="inline-flex gap-1">
                      <Button asChild size="sm" variant="ghost" title="View">
                        <Link href={`/cars/${c.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" title="Edit">
                        <Link href={`/owner/cars/${c.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" title="Availability">
                        <Link href={`/owner/cars/${c.id}/availability`}><CalendarCheck className="h-4 w-4" /></Link>
                      </Button>
                      <Button asChild size="sm" variant="ghost" title="Bookings">
                        <Link href={`/owner/cars/${c.id}/bookings`}>
                          Requests
                          {c.bookings.length > 0 && (
                            <span className="ml-1.5 rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
                              {c.bookings.length}
                            </span>
                          )}
                        </Link>
                      </Button>
                    </div>
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