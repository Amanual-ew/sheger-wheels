import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { AdminNav } from '@/components/admin-nav'
import { formatDateTime } from '@/lib/format'
import { ResolveDisputeForm } from './resolve-dispute-form'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminDisputeDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const dispute = await db.dispute.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          renter: { select: { name: true, email: true } },
          owner: { select: { name: true, email: true } },
          car: { select: { make: true, model: true, id: true } },
        },
      },
      opener: { select: { name: true } },
      resolver: { select: { name: true } },
    },
  })
  if (!dispute) notFound()

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Resolve dispute</h1>
        <p className="text-sm text-muted-foreground">
          {dispute.booking.car.make} {dispute.booking.car.model}
        </p>
      </header>
      <AdminNav />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Dispute details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Opened by" value={dispute.opener?.name ?? 'system'} />
          <Row label="Reason" value={<span className="capitalize">{dispute.reason.replace('_', ' ')}</span>} />
          <Row label="Opened" value={formatDateTime(dispute.createdAt)} />
          <Row label="Status" value={<StatusBadge status={dispute.status} />} />
          {dispute.resolver && (
            <Row label="Resolved by" value={`${dispute.resolver.name} · ${formatDateTime(dispute.resolvedAt)}`} />
          )}
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground mb-1">Description</p>
            <p>{dispute.description}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Booking</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <Row label="Renter" value={`${dispute.booking.renter.name} (${dispute.booking.renter.email})`} />
          <Row label="Owner" value={`${dispute.booking.owner.name} (${dispute.booking.owner.email})`} />
          <Row label="Dates" value={`${dispute.booking.startDate} → ${dispute.booking.endDate}`} />
          <Row label="Total" value={`ETB ${dispute.booking.total.toLocaleString()}`} />
          <div className="pt-2">
            <Button asChild size="sm" variant="outline">
              <Link href={`/bookings/${dispute.bookingId}`}>View booking</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {dispute.status === 'open' ? (
        <ResolveDisputeForm disputeId={dispute.id} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p>{dispute.resolutionNotes || 'No notes recorded.'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
