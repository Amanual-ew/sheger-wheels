import { db } from '@/lib/db'
import { requireUser } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrackClient } from './track-client'
import { StatusBadge } from '@/components/status-badge'
import { formatETB, formatDate } from '@/lib/format'
import Link from 'next/link'
import { MapPin, Clock, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrackPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await requireUser()
  const booking = await db.booking.findUnique({
    where: { id },
    include: { car: true },
  })
  if (!booking || (booking.renterId !== session.user.id && booking.ownerId !== session.user.id)) {
    notFound()
  }
  if (!['confirmed', 'in_progress'].includes(booking.status)) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h1 className="font-semibold mb-2">Tracking unavailable</h1>
            <p className="text-sm text-muted-foreground mb-4">
              Trip tracking is only available for confirmed or in-progress bookings.
              This booking is <strong>{booking.status}</strong>.
            </p>
            <Link href={`/bookings/${booking.id}`} className="text-primary hover:underline text-sm">
              Back to booking →
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h1 className="text-2xl md:text-3xl font-bold">Trip tracking</h1>
          <StatusBadge status={booking.status} />
          <span className="text-xs bg-amber-500/15 text-amber-700 px-2 py-0.5 rounded border border-amber-500/30">
            Simulation
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {booking.car.make} {booking.car.model} · {formatDate(booking.startDate)} → {formatDate(booking.endDate)} · {formatETB(booking.total)}
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Simulated trip map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackClient
            lat={booking.car.latitude}
            lng={booking.car.longitude}
            neighbourhood={booking.car.neighbourhood}
          />
          <div className="mt-3 text-xs text-muted-foreground flex items-start gap-2">
            <Clock className="h-3 w-3 mt-0.5 shrink-0" />
            <p>
              This is a <strong>simulation</strong>. The marker moves between
              seeded points to demonstrate the tracking UI. No real GPS data is
              collected or transmitted. The car's actual coordinates are
              fixed demo values for {booking.car.neighbourhood}, Addis Ababa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
