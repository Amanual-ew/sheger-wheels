import { cache } from 'react'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { CarDetailMap } from './car-detail-map'
import { BookingRequestForm } from './booking-request-form'
import { formatETB, formatDate } from '@/lib/format'
import { carPhotos, carUnavailableDates } from '@/lib/utils'
import { getCurrentSession } from '@/lib/session'
import {
  MapPin,
  Users,
  Gauge,
  Fuel,
  CalendarDays,
  Star,
  ShieldCheck,
  Car,
  Eye,
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const getCar = cache(async (id: string) => {
  return db.car.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      reviews: {
        include: {
          renter: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
})

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const car = await getCar(id)

  if (!car) {
    return {
      title: 'Car Not Found | Sheggar Wheels',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  // Do not expose unapproved listings in social previews or search results.
  if (car.status !== 'approved') {
    return {
      title: 'Listing Preview | Sheggar Wheels',
      robots: {
        index: false,
        follow: false,
      },
    }
  }

  const title = `${car.year} ${car.make} ${car.model} for Rent`

  const description =
    `Rent a ${car.year} ${car.make} ${car.model} in ` +
    `${car.neighbourhood}, Addis Ababa. ` +
    `${formatETB(car.pricePerDay)} per day with Sheggar Wheels.`

  const photos = carPhotos(car.photos)
  const image = photos[0] || '/sheger-wheels-og.png'

  return {
    title: `${title} | Sheggar Wheels`,
    description,

    openGraph: {
      type: 'website',
      siteName: 'Sheggar Wheels',
      title,
      description,
      url: `/cars/${encodeURIComponent(car.id)}`,
      images: [
        {
          url: image,
          alt: `${car.year} ${car.make} ${car.model} available for rent in Addis Ababa`,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  }
}

export default async function CarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [car, session] = await Promise.all([
    getCar(id),
    getCurrentSession(),
  ])

  if (!car) notFound()

  // Admins and the car's owner may preview unapproved listings.
  // Other visitors can only access approved listings.
  const roles = session?.user?.roles ?? []
  const isAdminViewer = roles.includes('admin')
  const isOwnerViewer =
    !!session?.user?.id && session.user.id === car.ownerId

  const isApproved = car.status === 'approved'

  if (!isApproved && !isAdminViewer && !isOwnerViewer) {
    notFound()
  }

  // Increment views for approved listings only.
  if (isApproved) {
    db.car
      .update({
        where: { id },
        data: { views: { increment: 1 } },
      })
      .catch(() => {})
  }

  const photos = carPhotos(car.photos)
  const unavailableDates = carUnavailableDates(car.unavailableDates)

  const avgRating =
    car.reviews.length > 0
      ? car.reviews.reduce((sum, review) => sum + review.rating, 0) /
        car.reviews.length
      : null

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Preview banner for unapproved listings */}
      {!isApproved && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-amber-500" />
            <span>
              <span className="font-semibold">Preview only.</span>{' '}
              This listing is{' '}
              <span className="font-semibold capitalize">
                {car.status}
              </span>{' '}
              and is not visible to the public.
            </span>
          </div>

          {isAdminViewer && (
            <Link
              href="/admin/listings"
              className="font-medium text-primary hover:underline"
            >
              Back to listings
            </Link>
          )}
        </div>
      )}

      {/* Breadcrumb */}
      <nav
        className="mb-4 text-xs text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="hover:text-primary">
          Home
        </Link>
        <span className="mx-1">/</span>
        <Link href="/cars" className="hover:text-primary">
          Cars
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">
          {car.make} {car.model}
        </span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column */}
        <div className="space-y-6">
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold md:text-3xl">
                  {car.year} {car.make} {car.model}
                </h1>

                <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {car.neighbourhood}, {car.city}
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-primary">
                  {formatETB(car.pricePerDay)}
                </p>
                <p className="text-xs text-muted-foreground">per day</p>
              </div>
            </div>

            {avgRating !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">
                  {avgRating.toFixed(1)}
                </span>
                <span className="text-muted-foreground">
                  · {car.reviews.length} review
                  {car.reviews.length === 1 ? '' : 's'}
                </span>
              </div>
            )}
          </div>

          {/* Gallery */}
          <div className="grid gap-2 sm:grid-cols-2">
            {photos.map((url, index) => (
              <div
                key={url}
                className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-muted ${
                  index === 0 ? 'sm:col-span-2' : ''
                }`}
              >
                <Image
                  src={url}
                  alt={`${car.make} ${car.model} photo ${index + 1}`}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover"
                  priority={index === 0}
                  unoptimized
                />
              </div>
            ))}
          </div>

          {/* Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Car className="h-4 w-4" />
                Specifications
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                <Spec
                  icon={Users}
                  label="Seats"
                  value={`${car.seats}`}
                />
                <Spec
                  icon={Gauge}
                  label="Transmission"
                  value={
                    car.transmission === 'automatic'
                      ? 'Automatic'
                      : 'Manual'
                  }
                />
                <Spec
                  icon={Fuel}
                  label="Fuel"
                  value={
                    <span className="capitalize">{car.fuel}</span>
                  }
                />
                <Spec
                  icon={CalendarDays}
                  label="Year"
                  value={`${car.year}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                About this car
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm leading-relaxed">
                {car.description}
              </p>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Pickup location
              </CardTitle>
            </CardHeader>

            <CardContent>
              <CarDetailMap
                lat={car.latitude}
                lng={car.longitude}
                neighbourhood={car.neighbourhood}
              />

              <p className="mt-3 text-xs text-muted-foreground">
                Approximate location in {car.neighbourhood}. Exact
                address shared after a confirmed booking. Coordinates
                are seeded demo data.
              </p>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-4 w-4" />
                Reviews ({car.reviews.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              {car.reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Be the first to leave one after your
                  trip!
                </p>
              ) : (
                <ul className="space-y-4">
                  {car.reviews.map((review) => (
                    <li
                      key={review.id}
                      className="border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="mb-1 flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {review.renter.name?.charAt(0) ?? 'R'}
                          </AvatarFallback>
                        </Avatar>

                        <div>
                          <p className="text-sm font-medium">
                            {review.renter.name}
                          </p>

                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }).map(
                              (_, index) => (
                                <Star
                                  key={index}
                                  className={`h-3 w-3 ${
                                    index < review.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-muted'
                                  }`}
                                />
                              ),
                            )}
                          </div>
                        </div>

                        <span className="ml-auto text-xs text-muted-foreground">
                          {formatDate(review.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-foreground/90">
                        {review.comment}
                      </p>

                      {review.ownerReply && (
                        <div className="ml-4 mt-2 border-l pl-3 text-sm">
                          <p className="mb-1 text-xs font-medium text-muted-foreground">
                            Owner reply
                          </p>
                          <p className="text-foreground/90">
                            {review.ownerReply}
                          </p>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: booking sidebar */}
        <aside className="self-start lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {formatETB(car.pricePerDay)}
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}/day
                </span>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {isApproved ? (
                <BookingRequestForm
                  carId={car.id}
                  pricePerDay={car.pricePerDay}
                  unavailableDates={unavailableDates}
                />
              ) : (
                <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
                  Booking is disabled while this listing is{' '}
                  <span className="font-medium capitalize text-foreground">
                    {car.status}
                  </span>
                  .
                </p>
              )}

              <div className="mt-4 space-y-2 border-t pt-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  Server-side ownership checks before any booking mutation.
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  Mock TeleBirr checkout — clearly labelled demo payment.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Owner summary */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Hosted by</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {car.owner.name?.charAt(0) ?? 'O'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <p className="font-medium">{car.owner.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Owner since {formatDate(new Date().toISOString())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unavailable dates */}
          {unavailableDates.length > 0 && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">
                  Unavailable dates
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-wrap gap-1">
                  {unavailableDates.map((date) => (
                    <Badge
                      key={date}
                      variant="outline"
                      className="text-xs"
                    >
                      {formatDate(date)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  )
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  )
}
