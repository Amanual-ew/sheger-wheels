import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatDateTime } from '@/lib/format'
import Link from 'next/link'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

type SearchParams = { status?: string }

export default async function AdminDisputesPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  await requireRole('admin')
  const sp = await searchParams
  const statusFilter = sp.status ?? 'open'

  const where: any = {}
  if (statusFilter !== 'all') where.status = statusFilter

  const disputes = await db.dispute.findMany({
    where,
    include: {
      booking: {
        include: {
          renter: { select: { name: true } },
          owner: { select: { name: true } },
          car: { select: { make: true, model: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Disputes</h1>
        <p className="text-sm text-muted-foreground">
          Review disputes and record resolutions.
        </p>
      </header>

      <div className="mb-4 flex gap-1 flex-wrap text-xs">
        {['open', 'resolved', 'all'].map((s) => (
          <Button key={s} asChild size="sm" variant={statusFilter === s ? 'default' : 'outline'}>
            <Link href={`/admin/disputes?status=${s}`} className="capitalize">{s}</Link>
          </Button>
        ))}
      </div>

      <div className="max-w-4xl">
        {disputes.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No disputes to review.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {disputes.map((d) => (
              <li key={d.id}>
                <Card className={d.status === 'open' ? 'border-l-4 border-l-orange-500' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-medium">
                          {d.booking.car.make} {d.booking.car.model}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Renter: {d.booking.renter.name} · Owner: {d.booking.owner.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Opened {formatDateTime(d.createdAt)} · Reason:{' '}
                          <span className="capitalize">{d.reason.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <StatusBadge status={d.status} />
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/admin/disputes/${d.id}`}>Resolve</Link>
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm mt-2">{d.description}</p>
                    {d.resolutionNotes && (
                      <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded text-sm">
                        <p className="text-xs text-muted-foreground mb-1">Resolution</p>
                        <p>{d.resolutionNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}