import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AdminNav } from '@/components/admin-nav'
import { formatETB, formatNumber, formatDate } from '@/lib/format'
import { Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminReportsPage() {
  await requireRole('admin')

  const [
    totalUsers, suspendedUsers,
    approvedCars, pendingCars, rejectedCars,
    totalBookings,
    bookingsByStatus,
    platformFeeAgg,
    openDisputes, resolvedDisputes,
    recentActivity,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { status: 'suspended' } }),
    db.car.count({ where: { status: 'approved' } }),
    db.car.count({ where: { status: 'pending' } }),
    db.car.count({ where: { status: 'rejected' } }),
    db.booking.count(),
    db.booking.groupBy({ by: ['status'], _count: true }),
    db.booking.aggregate({ where: { paymentStatus: 'paid' }, _sum: { fee: true } }),
    db.dispute.count({ where: { status: 'open' } }),
    db.dispute.count({ where: { status: 'resolved' } }),
    db.activityLog.count(),
  ])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Platform reports</h1>
          <p className="text-sm text-muted-foreground">
            Summary metrics for the platform. Export the full CSV for record-keeping.
          </p>
        </div>
        <Button asChild>
          <a href="/api/export/platform-report.csv">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </a>
        </Button>
      </header>
      <AdminNav />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Users</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total" value={formatNumber(totalUsers)} />
            <Row label="Suspended" value={formatNumber(suspendedUsers)} />
            <Row label="Active" value={formatNumber(totalUsers - suspendedUsers)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Cars</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Approved" value={formatNumber(approvedCars)} />
            <Row label="Pending" value={formatNumber(pendingCars)} />
            <Row label="Rejected" value={formatNumber(rejectedCars)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Bookings</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Total" value={formatNumber(totalBookings)} />
            {bookingsByStatus.map((b) => (
              <Row key={b.status} label={b.status} value={formatNumber(b._count)} />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Disputes &amp; fee</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Open disputes" value={formatNumber(openDisputes)} />
            <Row label="Resolved disputes" value={formatNumber(resolvedDisputes)} />
            <Row label="Platform fee (mock)" value={formatETB(platformFeeAgg._sum.fee ?? 0)} />
            <Row label="Activity log rows" value={formatNumber(recentActivity)} />
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground mt-6">
        Report generated {formatDate(new Date().toISOString())}. All numbers are live from the SQLite database.
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground capitalize">{label.replace('_', ' ')}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
