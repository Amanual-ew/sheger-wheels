import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Users, Gauge, Fuel, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatETB } from '@/lib/format'
import { carPhotos, FALLBACK_IMAGE, cn } from '@/lib/utils'
import type { Car } from '@prisma/client'

type CarWithRatings = Car & { reviews?: { rating: number }[] }

export function CarCard({
  car,
  className,
  priority = false,
}: {
  car: CarWithRatings
  className?: string
  /** Set true for the first 1-2 cards on a page so their image loads first (better LCP). */
  priority?: boolean
}) {
  const photos = carPhotos(car.photos)
  const primaryPhoto = photos[0] ?? FALLBACK_IMAGE

  // Fallback is a data: SVG, which Next's optimizer can't process.
  const isFallback = primaryPhoto === FALLBACK_IMAGE

  const reviewCount = car.reviews?.length ?? 0
  const avgRating =
    reviewCount > 0
      ? car.reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null

  return (
    <Link href={`/cars/${car.id}`} className="block group">
      <Card
        className={cn(
          'overflow-hidden card-hover hover:shadow-md h-full gap-0 py-0',
          className,
        )}
      >
        <div className="relative aspect-[16/10] bg-muted">
          <Image
            src={primaryPhoto}
            alt={`${car.make} ${car.model}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={priority ? 75 : 60}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            priority={priority}
            unoptimized={isFallback}
          />

          {/* readability gradient for the overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

          {/* Rate: top-left */}
          <div className="absolute top-2 left-2 rounded-lg bg-primary text-primary-foreground px-2.5 py-1 shadow-sm">
            <p className="font-bold text-sm leading-tight">
              {formatETB(car.pricePerDay)}
            </p>
            <p className="text-[10px] leading-tight opacity-80">per day</p>
          </div>

          {/* Year: top-right */}
          <Badge
            className="absolute top-2 right-2 text-[10px] px-1.5 py-0"
            variant="secondary"
          >
            {car.year}
          </Badge>

          {/* Location: bottom-left */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/55 backdrop-blur-sm text-white px-2.5 py-1 text-[11px] font-medium max-w-[75%]">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{car.neighbourhood}</span>
          </div>
        </div>

        <div className="p-3 space-y-1.5">
          <h3 className="font-semibold text-sm leading-tight truncate">
            {car.make} {car.model}
          </h3>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground border-t pt-1.5">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> {car.seats}
            </span>
            <span className="flex items-center gap-1">
              <Gauge className="h-3 w-3" /> {car.transmission === 'automatic' ? 'Auto' : 'Manual'}
            </span>
            <span className="flex items-center gap-1 capitalize">
              <Fuel className="h-3 w-3" /> {car.fuel}
            </span>
            <span className="ml-auto flex items-center gap-1">
              {avgRating !== null ? (
                <>
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="font-semibold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span>({reviewCount})</span>
                </>
              ) : (
                <>
                  <Star className="h-3 w-3" />
                  <span>New</span>
                </>
              )}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}