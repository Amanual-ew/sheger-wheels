import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatETB, formatDate } from '@/lib/format'
import { CheckoutClient } from './checkout-client'
import Link from 'next/link'
import { CreditCard, ShieldCheck } from 'lucide-react'

export const dynamic = 'force-dynamic'

function maskPhone(p?: string | null) {
  if (!p) return null
  if (p.length < 8) return '•••••'
  return p.slice(0, 4) + '•••••' + p.slice(-3)
}

export default async function CheckoutPage({
  searchParams,
}: { searchParams: Promise<{ bookingId?: string }> }) {
  const session = await requireUser()
  const sp = await searchParams
  const bookingId = sp.bookingId
  if (!bookingId) notFound()

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      car: true,
      owner: { select: { name: true, phone: true } },
    },
  })
  if (!booking || booking.renterId !== session.user.id) notFound()

  const owner = booking.owner

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Mock checkout</h1>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          No real payment is processed. This is a simulated TeleBirr checkout.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Order summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Car</span>
            <Link href={`/cars/${booking.carId}`} className="font-medium hover:text-primary">
              {booking.car.make} {booking.car.model}
            </Link>
          </div>
          <div className="flex justify-between">
            <span>Dates</span>
            <span>{formatDate(booking.startDate)} → {formatDate(booking.endDate)}</span>
          </div>
          <div className="flex justify-between">
            <span>Duration</span>
            <span>{booking.days} day{booking.days === 1 ? '' : 's'}</span>
          </div>
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatETB(booking.subtotal)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Platform fee (10%)</span>
            <span>{formatETB(booking.fee)}</span>
          </div>
          <div className="flex justify-between font-semibold text-base border-t pt-2">
            <span>Total</span>
            <span className="text-primary">{formatETB(booking.total)}</span>
          </div>
        </CardContent>
      </Card>

      <CheckoutClient
        bookingId={booking.id}
        paymentStatus={booking.paymentStatus}
        status={booking.status}
        ownerName={owner.name}
        ownerPhoneMasked={maskPhone(owner.phone)}
      />

      <p className="text-center text-xs text-muted-foreground mt-4">
        After payment, your booking still requires the owner to approve it
        (unless they pre-approved). Watch your dashboard for updates.
      </p>
    </div>
  )
}