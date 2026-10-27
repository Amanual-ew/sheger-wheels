import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OwnerNav } from '@/components/owner-nav'
import { AvailabilityClient } from './availability-client'
import { formatDate } from '@/lib/format'
import { carUnavailableDates } from '@/lib/utils'
import { CalendarDays } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AvailabilityPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await requireRole('owner')
  const { id } = await params
  const car = await db.car.findUnique({ where: { id } })
  if (!car || car.ownerId !== session.user.id) notFound()
  const unavailable = carUnavailableDates(car.unavailableDates)

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Availability — {car.make} {car.model}</h1>
        <p className="text-sm text-muted-foreground">
          Add dates when this car should not be bookable.
        </p>
      </header>
      <OwnerNav />
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarDays className="h-4 w-4" /> Manage unavailable dates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityClient carId={car.id} unavailable={unavailable} />
        </CardContent>
      </Card>
    </div>
  )
}
