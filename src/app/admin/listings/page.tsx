import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { Eye, Inbox } from 'lucide-react'
import { ModerateCarActions } from './moderate-car-actions'

export const dynamic = 'force-dynamic'

type SearchParams = { status?: string }

export default async function AdminListingsPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  await requireRole('admin')
  const sp = await searchParams
  const statusFilter = sp.status ?? 'pending'

  const where: any = {}
  if (statusFilter !== 'all') where.status = statusFilter

  const cars = await db.car.findMany({
    where,
    include: { owner: { select: { name: true, email: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Listings moderation</h1>
        <p className="text-sm text-muted-foreground">
          Review car listings submitted by owners, then approve or reject them.
        </p>
      </header>

      <div className="mb-4 flex gap-1 flex-wrap text-xs">
        {['pending', 'approved', 'rejected', 'all'].map((s) => (
          <Button
            key={s}
            asChild
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
          >
            <Link href={`/admin/listings?status=${s}`} className="capitalize">
              {s}
            </Link>
          </Button>
        ))}
      </div>

      {cars.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No {statusFilter !== 'all' ? statusFilter : ''} listings to show.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">Car</th>
                <th className="py-2 pr-3">Owner</th>
                <th className="py-2 pr-3">Price/day</th>
                <th className="py-2 pr-3">Neighbourhood</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Submitted</th>
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
                  <td className="py-3 pr-3">
                    <p>{c.owner.name}</p>
                    <p className="text-xs text-muted-foreground">{c.owner.email}</p>
                  </td>
                  <td className="py-3 pr-3">{formatETB(c.pricePerDay)}</td>
                  <td className="py-3 pr-3">{c.neighbourhood}</td>
                  <td className="py-3 pr-3"><StatusBadge status={c.status} /></td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDate(c.createdAt)}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/cars/${c.id}`}>
                          <Eye className="h-4 w-4 mr-1" /> Preview
                        </Link>
                      </Button>
                      <ModerateCarActions carId={c.id} status={c.status} />
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