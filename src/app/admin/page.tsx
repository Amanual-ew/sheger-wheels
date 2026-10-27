import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminCharts } from './admin-charts'
import { formatETB, formatDate, formatNumber } from '@/lib/format'
import {
  Users, Car, CalendarDays, DollarSign, Activity, AlertTriangle,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const session = await requireRole('admin')

  const [
    totalUsers, activeUsers, suspendedUsers,
    approvedCars, pendingCars, rejectedCars,
    totalBookings, bookingsByStatus,
    platformFeeAgg,
    openDisputes,
    recentActivity,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'active' } }),
    db.user.count({ where: { status: 'suspended' } }),
    db.car.count({ where: { status: 'approved' } }),
    db.car.count({ where: { status: 'pending' } }),
    db.car.count({ where: { status: 'rejected' } }),
    db.booking.count(),
    db.booking.groupBy({
      by: ['status'],
      _count: true,
    }),
    db.booking.aggregate({
      _sum: { fee: true },
      where: { paymentStatus: 'paid' },
    }),
    db.dispute.count({ where: { status: 'open' } }),
    db.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ])

  const stats = [
    { label: 'Total users', value: formatNumber(totalUsers), sub: `${suspendedUsers} suspended`, icon: Users, color: 'text-accent' },
    { label: 'Approved cars', value: formatNumber(approvedCars), sub: `${pendingCars} pending`, icon: Car, color: 'text-emerald-600' },
    { label: 'Total bookings', value: formatNumber(totalBookings), sub: `${openDisputes} open disputes`, icon: CalendarDays, color: 'text-amber-600' },
    { label: 'Platform fee', value: formatETB(platformFeeAgg._sum.fee ?? 0), sub: 'mock commission', icon: DollarSign, color: 'text-primary' },
  ]

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Platform overview, moderation, and metrics. Signed in as {session.user.email}.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg bg-muted ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bookings by status</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminCharts data={bookingsByStatus.map((b) => ({ status: b.status, count: b._count }))} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" /> Recent activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {recentActivity.length === 0 ? (
                <li className="text-muted-foreground">No recent activity.</li>
              ) : (
                recentActivity.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 border-b last:border-0 pb-2 last:pb-0">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {a.user?.name?.charAt(0) ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs">
                        <span className="font-medium">{a.user?.name ?? 'system'}</span>{' '}
                        <code className="text-[10px] text-muted-foreground">{a.action}</code>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(a.createdAt)}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Pending moderation
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <a href="/admin/listings">Review listings</a>
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              There {pendingCars === 1 ? 'is' : 'are'} <strong className="text-foreground">{pendingCars}</strong> car listing{pendingCars === 1 ? '' : 's'} waiting for approval and <strong className="text-foreground">{openDisputes}</strong> open dispute{openDisputes === 1 ? '' : 's'} to resolve.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}