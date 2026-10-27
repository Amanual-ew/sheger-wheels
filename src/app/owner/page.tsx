import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { OwnerNav } from '@/components/owner-nav'
import { OwnerEarningsChart } from './owner-earnings-chart'
import { getOwnerEarningsSeries } from '@/lib/owner-analytics'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import {
  Car, CalendarCheck, DollarSign, Inbox, PlusCircle, TrendingUp, Clock, Star,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboardPage() {
  const session = await requireRole('owner')
  const ownerId = session.user.id

  const [cars, pendingRequests, activeBookings, earningsAgg, completedBookings, earningsSeries] = await Promise.all([
    db.car.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    }),
    db.booking.count({
      where: { ownerId, status: 'requested' },
    }),
    db.booking.count({
      where: { ownerId, status: { in: ['confirmed', 'in_progress'] } },
    }),
    db.booking.aggregate({
      where: { ownerId, paymentStatus: 'paid' },
      _sum: { subtotal: true, fee: true, total: true },
    }),
    db.booking.findMany({
      where: { ownerId, status: 'reviewed' },
      include: { car: true, renter: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    getOwnerEarningsSeries(ownerId),
  ])

  const approvedCars = cars.filter((c) => c.status === 'approved')
  const totalEarnings = earningsAgg._sum.subtotal ?? 0
  const platformFee = earningsAgg._sum.fee ?? 0
  const netEarnings = totalEarnings - platformFee

  const stats = [
    { label: 'Approved cars', value: approvedCars.length, icon: Car, color: 'text-accent' },
    { label: 'Pending requests', value: pendingRequests, icon: Clock, color: 'text-amber-600' },
    { label: 'Active rentals', value: activeBookings, icon: CalendarCheck, color: 'text-emerald-600' },
    { label: 'Net earnings', value: formatETB(netEarnings), icon: DollarSign, color: 'text-primary' },
  ]

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Owner dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage your cars, requests, earnings, and reviews.
          </p>
        </div>
        <Button asChild>
          <Link href="/owner/cars/new">
            <PlusCircle className="h-4 w-4 mr-1" /> List a car
          </Link>
        </Button>
      </header>

      <OwnerNav />

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
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
        {/* Earnings chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Earnings (last 6 months)
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/earnings">Details</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <OwnerEarningsChart data={earningsSeries} />
          </CardContent>
        </Card>

        {/* Pending requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending requests
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/cars">All cars</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingRequests === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No pending booking requests. New requests will appear here.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You have <strong className="text-foreground">{pendingRequests}</strong> pending
                request{pendingRequests === 1 ? '' : 's'}. Go to your cars to review them.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cars */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" /> My cars ({cars.length})
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/owner/cars">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {cars.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="font-medium text-sm mb-2">You have no cars listed</p>
                <Button asChild size="sm">
                  <Link href="/owner/cars/new">List your first car</Link>
                </Button>
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {cars.slice(0, 4).map((c) => (
                  <li key={c.id} className="border rounded-lg p-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.make} {c.model}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatETB(c.pricePerDay)}/day · {c.neighbourhood}
                      </p>
                      <div className="mt-1"><StatusBadge status={c.status} /></div>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/owner/cars/${c.id}/edit`}>Edit</Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent reviews */}
        {completedBookings.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" /> Recent reviews
              </CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/owner/reviews">All reviews</Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {completedBookings.map((b) => (
                  <li key={b.id} className="border-b last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{b.renter.name}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{b.car.make} {b.car.model}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDate(b.updatedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
