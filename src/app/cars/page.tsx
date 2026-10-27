import Link from 'next/link'
import { db } from '@/lib/db'
import { CarCard } from '@/components/car-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SearchX, SlidersHorizontal } from 'lucide-react'
import { CarCatalogueFilters } from './filters'
import { SortSelect } from './sort-select'
import { SearchBar } from './search-bar'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Browse cars',
  description: 'Browse and filter peer-to-peer rental cars across Addis Ababa neighbourhoods.',
}

type SearchParams = {
  q?: string
  neighbourhood?: string
  minPrice?: string
  maxPrice?: string
  transmission?: string
  minSeats?: string
  sort?: string
  page?: string
}

const PAGE_SIZE = 9
const SORTS = ['newest', 'price-asc', 'price-desc', 'popular']

export default async function CarsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const sortValue = SORTS.includes(sp.sort ?? '') ? sp.sort! : 'newest'

  const where: any = { status: 'approved' }
  if (sp.q) {
    where.OR = [
      { make: { contains: sp.q } },
      { model: { contains: sp.q } },
      { description: { contains: sp.q } },
    ]
  }
  if (sp.neighbourhood) where.neighbourhood = sp.neighbourhood
  if (sp.transmission) where.transmission = sp.transmission
  if (sp.minSeats) where.seats = { gte: Number(sp.minSeats) }
  if (sp.minPrice || sp.maxPrice) {
    where.pricePerDay = {}
    if (sp.minPrice) where.pricePerDay.gte = Number(sp.minPrice)
    if (sp.maxPrice) where.pricePerDay.lte = Number(sp.maxPrice)
  }

  const orderBy: any = (() => {
    switch (sortValue) {
      case 'price-asc': return { pricePerDay: 'asc' }
      case 'price-desc': return { pricePerDay: 'desc' }
      case 'popular': return { views: 'desc' }
      default: return { createdAt: 'desc' }
    }
  })()

  const [total, cars, allNeighbourhoods] = await Promise.all([
    db.car.count({ where }),
    db.car.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { reviews: { select: { rating: true } } },
    }),
    db.car.findMany({
      where: { status: 'approved' },
      select: { neighbourhood: true },
      distinct: ['neighbourhood'],
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const neighbourhoods = allNeighbourhoods.map((c) => c.neighbourhood).sort()
  const hasBadges =
    sp.neighbourhood || sp.transmission || sp.minPrice || sp.maxPrice || sp.minSeats

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Browse cars</h1>
        <p className="text-sm text-muted-foreground">
          {total} car{total === 1 ? '' : 's'} available across Addis Ababa.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filters sidebar */}
        <aside>
          <Card className="p-4 gap-0 sticky top-20">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="h-4 w-4" />
              <h2 className="font-semibold text-sm">Filters</h2>
            </div>
            <CarCatalogueFilters
              neighbourhoods={neighbourhoods}
              current={sp}
            />
          </Card>
        </aside>

        {/* Results */}
        <section>
          {/* Search + sort toolbar: always visible, even with zero results */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
            <SearchBar initial={sp.q ?? ''} />
            <SortSelect value={sortValue} />
          </div>

          {hasBadges && (
            <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
              {sp.neighbourhood && <Badge variant="secondary">{sp.neighbourhood}</Badge>}
              {sp.transmission && <Badge variant="secondary" className="capitalize">{sp.transmission}</Badge>}
              {sp.minPrice && <Badge variant="secondary">≥ ETB {sp.minPrice}</Badge>}
              {sp.maxPrice && <Badge variant="secondary">≤ ETB {sp.maxPrice}</Badge>}
              {sp.minSeats && <Badge variant="secondary">≥ {sp.minSeats} seats</Badge>}
            </div>
          )}

          {cars.length === 0 ? (
            <Card className="p-12 text-center">
              <SearchX className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <h3 className="font-semibold mb-1">No cars match your filters</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Try widening your price range, removing the search term, or
                picking a different neighbourhood.
              </p>
              <Button asChild>
                <Link href="/cars">Reset filters</Link>
              </Button>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cars.map((car, i) => (
                  <CarCard key={car.id} car={car} priority={i < 3} />
                ))}
              </div>

              {/* Pagination */}
              <nav
                className="mt-8 flex items-center justify-center gap-1"
                aria-label="Pagination"
              >
                {page > 1 && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildPageLink(sp, page - 1)}>Previous</Link>
                  </Button>
                )}
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1
                  if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
                    if (p === page - 3 || p === page + 3) {
                      return <span key={p} className="px-2 text-muted-foreground">…</span>
                    }
                    return null
                  }
                  return (
                    <Button
                      key={p}
                      asChild
                      variant={p === page ? 'default' : 'outline'}
                      size="sm"
                      className="min-w-9"
                    >
                      <Link href={buildPageLink(sp, p)}>{p}</Link>
                    </Button>
                  )
                })}
                {page < totalPages && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={buildPageLink(sp, page + 1)}>Next</Link>
                  </Button>
                )}
              </nav>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Page {page} of {totalPages}
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function buildPageLink(sp: SearchParams, page: number): string {
  const params = new URLSearchParams()
  if (sp.q) params.set('q', sp.q)
  if (sp.neighbourhood) params.set('neighbourhood', sp.neighbourhood)
  if (sp.transmission) params.set('transmission', sp.transmission)
  if (sp.minPrice) params.set('minPrice', sp.minPrice)
  if (sp.maxPrice) params.set('maxPrice', sp.maxPrice)
  if (sp.minSeats) params.set('minSeats', sp.minSeats)
  if (sp.sort) params.set('sort', sp.sort)
  params.set('page', String(page))
  return `/cars?${params.toString()}`
}