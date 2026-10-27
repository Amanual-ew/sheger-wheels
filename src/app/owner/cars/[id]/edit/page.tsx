import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { notFound } from 'next/navigation'
import { OwnerNav } from '@/components/owner-nav'
import { CarForm } from '../../new/car-form'

export const dynamic = 'force-dynamic'

export default async function EditCarPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const session = await requireRole('owner')
  const { id } = await params
  const car = await db.car.findUnique({ where: { id } })
  if (!car || car.ownerId !== session.user.id) notFound()
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Edit {car.make} {car.model}</h1>
        <p className="text-sm text-muted-foreground">
          Update your car details. Status changes are reflected immediately.
        </p>
      </header>
      <OwnerNav />
      <CarForm
        mode="edit"
        initial={{
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          transmission: car.transmission,
          seats: car.seats,
          fuel: car.fuel,
          neighbourhood: car.neighbourhood,
          pricePerDay: car.pricePerDay,
          photos: JSON.parse(car.photos || '[]'),
          description: car.description,
          status: car.status,
        }}
      />
    </div>
  )
}
