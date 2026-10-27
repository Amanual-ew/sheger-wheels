import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { CarCard } from '@/components/car-card'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight, Car, ShieldCheck, Wallet, MapPin, Users, CalendarCheck,
  Search, Megaphone, KeyRound, ChevronDown,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const NEIGHBOURHOODS = [
  'Bole', 'Kazanchis', 'Piassa', 'Merkato', 'Sarbet', 'Megenagna', '4 Kilo',
]

const PRICE_SHORTCUTS = [
  { label: 'Under 2,000 ETB', href: '/cars?maxPrice=2000' },
  { label: '2,000 – 4,000 ETB', href: '/cars?minPrice=2000&maxPrice=4000' },
  { label: '4,000 ETB and up', href: '/cars?minPrice=4000' },
]

const FAQ = [
  {
    q: 'How do I book a car?',
    a: 'Pick a car, choose your dates, and send a request. The owner confirms or declines it, then you finish a mock TeleBirr checkout.',
  },
  {
    q: 'Can I list my own car?',
    a: 'Yes. Create an account, add your car with photos, price and neighbourhood, and an admin approves the listing before it goes live.',
  },
  {
    q: 'What if something goes wrong on a trip?',
    a: 'Either side can open a dispute on a booking. An admin reviews it and records the resolution.',
  },
  {
    q: 'Is the payment real?',
    a: 'No. This is a demo, so checkout is simulated and no money moves.',
  },
]

async function getFeaturedCars() {
  return db.car.findMany({
    where: { status: 'approved' },
    orderBy: [{ views: 'desc' }, { createdAt: 'desc' }],
    take: 6,
    include: { reviews: { select: { rating: true } } },
  })
}

async function getActiveAnnouncements() {
  return db.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 2,
  })
}

async function getStats() {
  const [cars, bookings, byArea] = await Promise.all([
    db.car.count({ where: { status: 'approved' } }),
    db.booking.count(),
    db.car.groupBy({
      by: ['neighbourhood'],
      where: { status: 'approved' },
      _count: true,
    }),
  ])
  return { cars, bookings, areas: byArea }
}

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  const signedIn = Boolean(session?.user)
  const roles = String((session?.user as any)?.roles ?? '')
  const dashboardHref = roles.includes('admin')
    ? '/admin'
    : roles.includes('owner')
      ? '/owner'
      : '/dashboard'

  const [featuredCars, announcements, stats] = await Promise.all([
    getFeaturedCars(),
    getActiveAnnouncements(),
    getStats(),
  ])

  const areaCounts = new Map(stats.areas.map((a) => [a.neighbourhood, a._count]))
  const areaChips = NEIGHBOURHOODS.map((n) => ({
    name: n,
    count: areaCounts.get(n) ?? 0,
  })).sort((a, b) => b.count - a.count)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl"
        />
        <div className="container relative mx-auto max-w-7xl px-4 py-12 md:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-xs">
                <MapPin className="mr-1 h-3 w-3" /> Addis Ababa, Ethiopia
              </Badge>
              <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
                Rent a car from <span className="text-primary">local owners</span> across Addis Ababa.
              </h1>
              <p className="max-w-prose text-lg text-muted-foreground">
                Owners list their cars, renters book by the day. Find something
                near Bole, Kazanchis, Sarbet or wherever you are.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/cars">
                    Browse cars <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  {signedIn ? (
                    <Link href={dashboardHref}>Go to my dashboard</Link>
                  ) : (
                    <Link href="/signup">Create an account</Link>
                  )}
                </Button>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-sm text-muted-foreground">Popular areas</p>
                <div className="flex flex-wrap gap-2">
                  {areaChips.slice(0, 5).map((a) => (
                    <Link
                      key={a.name}
                      href={`/cars?neighbourhood=${encodeURIComponent(a.name)}`}
                      className="rounded-full border bg-card px-3 py-1 text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      {a.name}
                      {a.count > 0 && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{a.count}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <form
              action="/cars"
              method="get"
              className="space-y-4 rounded-2xl border bg-card p-6 shadow-lg shadow-primary/5"
            >
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Find your car</h2>
              </div>
              <div>
                <label htmlFor="q" className="text-sm font-medium">Make or model</label>
                <input
                  id="q"
                  name="q"
                  type="text"
                  placeholder="e.g. Toyota Corolla"
                  className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="minPrice" className="text-sm font-medium">Min ETB/day</label>
                  <input
                    id="minPrice"
                    name="minPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="0"
                    className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="maxPrice" className="text-sm font-medium">Max ETB/day</label>
                  <input
                    id="maxPrice"
                    name="maxPrice"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="10000"
                    className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="neighbourhood" className="text-sm font-medium">Neighbourhood</label>
                <select
                  id="neighbourhood"
                  name="neighbourhood"
                  defaultValue=""
                  className="mt-1 h-11 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="">Any</option>
                  {NEIGHBOURHOODS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Search cars
              </Button>
              <div className="flex flex-wrap gap-2 border-t pt-4">
                {PRICE_SHORTCUTS.map((p) => (
                  <Link
                    key={p.href}
                    href={p.href}
                    className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Live numbers */}
      <section className="border-b bg-card">
        <div className="container mx-auto grid max-w-7xl grid-cols-3 divide-x px-4">
          {[
            { value: stats.cars, label: 'cars available' },
            { value: stats.areas.length, label: 'neighbourhoods covered' },
            { value: stats.bookings, label: 'bookings made' },
          ].map((s) => (
            <div key={s.label} className="px-3 py-5 text-center md:py-6">
              <div className="text-2xl font-bold md:text-3xl">{s.value}</div>
              <div className="text-xs text-muted-foreground md:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

            {/* Announcements */}
      {announcements.length > 0 && (
        <section className="container mx-auto mt-8 max-w-7xl px-4">
          <div
            className={`grid gap-4 ${announcements.length > 1 ? 'md:grid-cols-2' : ''}`}
          >
            {announcements.map((a) => {
              const isNew =
                Date.now() - new Date(a.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000

              return (
                <article
                  key={a.id}
                  className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/15 via-card to-primary/10 p-5 shadow-sm transition-shadow hover:shadow-md md:p-6"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl"
                  />

                  <div className="relative flex gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
                      <Megaphone className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent">
                          Announcement
                        </span>
                        {isNew && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                            New
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(a.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold leading-snug">{a.title}</h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {a.message}
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {/* Featured cars */}
      <section className="container mx-auto max-w-7xl px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold">Featured cars</h2>
            <p className="text-sm text-muted-foreground">
              The most-viewed cars from local owners.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/cars">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {featuredCars.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No cars are listed yet. Check back soon.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredCars.map((car) => (
              <CarCard key={car.id} car={car} />
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="border-y bg-secondary/30">
        <div className="container mx-auto max-w-7xl px-4 py-14">
          <h2 className="mb-2 text-center text-2xl font-bold">How it works</h2>
          <p className="mx-auto mb-10 max-w-xl text-center text-sm text-muted-foreground">
            From search to review in three steps.
          </p>
          <ol className="grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Car,
                title: 'Browse and search',
                desc: 'Filter by neighbourhood, price, transmission and seats, and see where each car is parked.',
              },
              {
                icon: CalendarCheck,
                title: 'Request a booking',
                desc: 'Pick your dates and send a request. The owner confirms, then you finish a mock TeleBirr checkout.',
              },
              {
                icon: Wallet,
                title: 'Drive and review',
                desc: 'Track your trip, mark it complete, and leave a review the owner can reply to.',
              },
            ].map((step, i) => (
              <li key={step.title} className="relative flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    <span className="mr-1 text-muted-foreground">{i + 1}.</span>
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Owner CTA */}
      <section className="container mx-auto max-w-7xl px-4 py-14">
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/15 via-card to-accent/10 p-8 md:p-12">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
                <KeyRound className="h-4 w-4" /> For car owners
              </div>
              <h2 className="text-2xl font-bold md:text-3xl">
                Got a car that sits idle? Let it earn.
              </h2>
              <p className="text-muted-foreground">
                Set your own daily price, choose when it&apos;s available, and
                approve every request. Track earnings, reviews and disputes
                from your owner dashboard.
              </p>
            </div>
            <Button asChild size="lg">
              <Link href={signedIn ? dashboardHref : '/signup'}>
                {signedIn ? 'Open my dashboard' : 'List your car'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="container mx-auto max-w-7xl px-4 pb-14">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: 'Reviewed listings',
              desc: 'Every car is approved by an admin before it appears in search.',
            },
            {
              icon: Users,
              title: 'Built for owners and renters',
              desc: 'Owners manage listings, availability and requests. Renters track bookings and reviews.',
            },
            {
              icon: MapPin,
              title: 'Local to Addis Ababa',
              desc: 'Cars are placed in real neighbourhoods so you can pick one close to you.',
            },
          ].map((t) => (
            <div key={t.title} className="flex gap-3">
              <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t.title}</h3>
                <p className="text-sm text-muted-foreground">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t bg-secondary/20">
        <div className="container mx-auto max-w-3xl px-4 py-14">
          <h2 className="mb-6 text-center text-2xl font-bold">Common questions</h2>
          <div className="space-y-2">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-lg border bg-card px-4 py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
                  {f.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}