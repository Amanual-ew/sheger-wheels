import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate, relativeTime } from '@/lib/format'
import Link from 'next/link'
import { CalendarDays, Car, Wallet, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { AnnouncementCards } from '@/components/announcement-cards'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Renter dashboard',
}

export default async function RenterDashboardPage() {
  const session = await requireUser()
  const renterId = session.user.id

  const [upcoming, past, cancelled, totalSpend] = await Promise.all([
    db.booking.findMany({
      where: {
        renterId,
        status: { in: ['requested', 'confirmed', 'in_progress'] },
      },
      include: { car: true },
      orderBy: { startDate: 'asc' },
    }),
    db.booking.findMany({
      where: {
        renterId,
        status: { in: ['completed', 'reviewed'] },
      },
      include: { car: true },
      orderBy: { endDate: 'desc' },
    }),
    db.booking.count({
      where: { renterId, status: 'cancelled' },
    }),
    db.booking.aggregate({
      where: { renterId, paymentStatus: 'paid' },
      _sum: { total: true },
    }),
  ])

  const totalSpendAmount = totalSpend._sum.total ?? 0
  const nextBooking = upcoming[0]

  const stats = [
    { label: 'Upcoming trips', value: upcoming.length, icon: CalendarDays, color: 'text-accent' },
    { label: 'Past trips', value: past.length, icon: Car, color: 'text-emerald-600' },
    { label: 'Cancelled', value: cancelled, icon: AlertCircle, color: 'text-rose-600' },
    { label: 'Total spend', value: formatETB(totalSpendAmount), icon: Wallet, color: 'text-primary' },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, {session.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Your renter dashboard — upcoming trips, past trips, and spend.
        </p>
      </header>

      <AnnouncementCards />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Upcoming trips
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming trips"
                body="Browse cars and request your first booking."
                cta={<Button asChild size="sm"><Link href="/cars">Browse cars</Link></Button>}
              />
            ) : (
              <ul className="space-y-3">
                {upcoming.slice(0, 3).map((b) => (
                  <li key={b.id} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.car.make} {b.car.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.startDate)} → {formatDate(b.endDate)}
                      </p>
                      <div className="mt-1"><StatusBadge status={b.status} /></div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/bookings/${b.id}`}>View</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Recent past trips
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/bookings">History</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {past.length === 0 ? (
              <EmptyState
                title="No past trips yet"
                body="Your trip history will appear here after your first completed rental."
              />
            ) : (
              <ul className="space-y-3">
                {past.slice(0, 3).map((b) => (
                  <li key={b.id} className="border rounded-lg p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{b.car.make} {b.car.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(b.endDate)} · {formatETB(b.total)}
                      </p>
                      <div className="mt-1"><StatusBadge status={b.status} /></div>
                    </div>
                    {b.status === 'completed' && (
                      <Button asChild size="sm" variant="default">
                        <Link href={`/bookings/${b.id}/review`}>Review</Link>
                      </Button>
                    )}
                    {b.status !== 'completed' && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/bookings/${b.id}`}>View</Link>
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next booking highlight */}
      {nextBooking && (
        <Card className="mt-6 border-l-4 border-l-accent">
          <CardContent className="p-4 flex flex-wrap items-center gap-3 justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Next booking</p>
              <p className="font-semibold">{nextBooking.car.make} {nextBooking.car.model}</p>
              <p className="text-xs">Pick up {formatDate(nextBooking.startDate)} ({relativeTime(nextBooking.startDate)})</p>
            </div>
            <Button asChild>
              <Link href={`/bookings/${nextBooking.id}`}>Open booking</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function EmptyState({
  title, body, cta,
}: { title: string; body: string; cta?: React.ReactNode }) {
  return (
    <div className="text-center py-8">
      <p className="font-medium text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mb-3">{body}</p>
      {cta}
    </div>
  )
}
