import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { OwnerNav } from '@/components/owner-nav'
import { OwnerEarningsChart } from '../owner-earnings-chart'
import {
  getOwnerEarningsSummary,
  getOwnerEarningsBreakdown,
  getOwnerEarningsSeries,
} from '@/lib/owner-analytics'
import { formatETB } from '@/lib/format'
import { Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function OwnerEarningsPage() {
  const session = await requireRole('owner')
  const ownerId = session.user.id
  const [summary, breakdown, series] = await Promise.all([
    getOwnerEarningsSummary(ownerId),
    getOwnerEarningsBreakdown(ownerId),
    getOwnerEarningsSeries(ownerId),
  ])

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-sm text-muted-foreground">
            Gross earnings minus the 10% platform fee = your net.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <a href="/api/export/earnings.csv">
            <Download className="h-4 w-4 mr-1" /> Export CSV
          </a>
        </Button>
      </header>
      <OwnerNav />

      <div className="grid gap-3 sm:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Gross</p>
            <p className="text-xl font-bold">{formatETB(summary.gross)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Platform fee</p>
            <p className="text-xl font-bold text-rose-600">{formatETB(summary.fee)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Net earnings</p>
            <p className="text-xl font-bold text-primary">{formatETB(summary.net)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Earnings trend (last 6 months)</CardTitle>
        </CardHeader>
        <CardContent>
          <OwnerEarningsChart data={series} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Per-car breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Car</th>
                  <th className="py-2 pr-3">Daily rate</th>
                  <th className="py-2 pr-3">Bookings</th>
                  <th className="py-2 pr-3">Booked days</th>
                  <th className="py-2 pr-3 text-right">Earnings</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.length === 0 ? (
                  <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No paid bookings yet.</td></tr>
                ) : (
                  breakdown.map((c) => (
                    <tr key={c.carId} className="border-b last:border-0">
                      <td className="py-3 pr-3 font-medium">{c.make} {c.model}</td>
                      <td className="py-3 pr-3">{formatETB(c.pricePerDay)}</td>
                      <td className="py-3 pr-3">{c.bookings}</td>
                      <td className="py-3 pr-3">{c.bookedDays}</td>
                      <td className="py-3 pr-3 text-right font-semibold">{formatETB(c.earnings)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
