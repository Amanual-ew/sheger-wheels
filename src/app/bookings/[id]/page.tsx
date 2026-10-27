import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate, formatDateTime } from '@/lib/format'
import { BookingActions } from './booking-actions'
import Link from 'next/link'
import {
  CalendarDays, MapPin, Car as CarIcon, Receipt, Wallet, AlertTriangle, User,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const TOTAL_LABEL: Record<string, string> = {
  unpaid: 'Total due',
  held: 'Total (payment held)',
  paid: 'Total paid',
  refunded: 'Total refunded',
}

async function getBooking(id: string, userId: string, isAdmin: boolean) {
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      car: { include: { owner: { select: { name: true } } } },
      renter: { select: { name: true, phone: true } },
      review: true,
      dispute: true,
    },
  })
  if (!booking) return null
  if (!isAdmin && booking.renterId !== userId && booking.ownerId !== userId) return null
  return booking
}

export default async function BookingDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireUser()

  const rawRoles = (session.user as { roles?: unknown }).roles
  const isAdmin = Array.isArray(rawRoles)
    ? rawRoles.includes('admin')
    : String(rawRoles ?? '').includes('admin')

  const booking = await getBooking(id, session.user.id, isAdmin)
  if (!booking) notFound()

  const isRenter = booking.renterId === session.user.id
  const isOwner = booking.ownerId === session.user.id

  const backHref = isRenter ? '/bookings' : isOwner ? '/owner' : '/admin/bookings'
  const backLabel = isRenter ? 'My bookings' : isOwner ? 'Owner dashboard' : 'All bookings'

  const pickup = booking.pickupLocation || booking.car.neighbourhood
  const totalLabel = TOTAL_LABEL[booking.paymentStatus] ?? 'Total'
  const disputeOpen = booking.dispute?.status === 'open'

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <nav className="text-xs text-muted-foreground mb-3" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-primary">Home</Link>
        <span className="mx-1">/</span>
        <Link href={backHref} className="hover:text-primary">{backLabel}</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{booking.id.slice(-8)}</span>
      </nav>

      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <h1 className="text-2xl md:text-3xl font-bold">
            {booking.car.make} {booking.car.model}
          </h1>
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
        <p className="text-sm text-muted-foreground">
          Booking receipt — share this page with the owner or admin during support.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          {/* Trip summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" /> Trip summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Pick up date" value={formatDate(booking.startDate)} />
              <Row label="Return date" value={formatDate(booking.endDate)} />
              <Row label="Duration" value={`${booking.days} day${booking.days === 1 ? '' : 's'}`} />
              <Row
                label="Pickup location"
                value={<span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {pickup}</span>}
              />
              {booking.notes && <Row label="Notes" value={booking.notes} />}
            </CardContent>
          </Card>

          {/* Renter (owner and admin only) */}
          {!isRenter && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Renter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <Row label="Name" value={booking.renter.name} />
                {booking.renter.phone && <Row label="Phone" value={booking.renter.phone} />}
              </CardContent>
            </Card>
          )}

          {/* Car summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CarIcon className="h-4 w-4" /> Car
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/cars/${booking.carId}`} className="text-sm font-medium hover:text-primary">
                {booking.car.year} {booking.car.make} {booking.car.model} →
              </Link>
              <p className="text-xs text-muted-foreground mt-1">
                {booking.car.transmission} · {booking.car.seats} seats · {booking.car.fuel}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Hosted by {booking.car.owner.name}
              </p>
            </CardContent>
          </Card>

          {/* Receipt */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-4 w-4" /> Receipt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <Row label={`Daily rate × ${booking.days} days`} value={formatETB(booking.subtotal)} />
              <Row label="Platform fee (10%)" value={formatETB(booking.fee)} />
              <Row label="Payment" value={<StatusBadge status={booking.paymentStatus} />} />
              <Row label="Booking ID" value={<code className="text-xs">{booking.id}</code>} />
              <Row label="Booked on" value={formatDateTime(booking.createdAt)} />
              <div className="border-t pt-2 mt-2 flex justify-between font-semibold text-base">
                <span>{totalLabel}</span>
                <span className="text-primary">{formatETB(booking.total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Review (if exists) */}
          {booking.review && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {isRenter ? 'Your review' : 'Renter review'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">Rating: {booking.review.rating} / 5</p>
                <p className="mt-1">{booking.review.comment}</p>
                {booking.review.ownerReply && (
                  <div className="mt-2 pl-3 border-l text-sm">
                    <p className="text-xs text-muted-foreground mb-1">Owner reply</p>
                    <p>{booking.review.ownerReply}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Dispute */}
          {booking.dispute && (
            <Card className={disputeOpen ? 'border-l-4 border-l-orange-500' : 'border-l-4 border-l-emerald-500'}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${disputeOpen ? 'text-orange-500' : 'text-emerald-600'}`} />
                  {disputeOpen ? 'Dispute open' : 'Dispute resolved'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <Row
                  label="Reason"
                  value={<span className="capitalize">{booking.dispute.reason.replace(/_/g, ' ')}</span>}
                />
                <Row label="Description" value={booking.dispute.description} />
                <Row label="Status" value={<StatusBadge status={booking.dispute.status} />} />
                {booking.dispute.resolutionNotes && (
                  <Row label="Resolution notes" value={booking.dispute.resolutionNotes} />
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <BookingActions
                booking={JSON.parse(JSON.stringify(booking))}
                isRenter={isRenter}
                isOwner={isOwner}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Booking ID</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="text-xs break-all">{booking.id}</code>
              <p className="text-xs text-muted-foreground mt-2">
                Reference this ID if you contact support.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
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