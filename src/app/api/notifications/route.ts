import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

type Item = {
  id: string
  kind: 'announcement' | 'booking'
  title: string
  body: string
  href: string
  createdAt: string
}

const RENTER_TEXT: Record<string, string> = {
  confirmed: 'Booking confirmed',
  declined: 'Booking declined',
  cancelled: 'Booking cancelled',
  in_progress: 'Your trip has started',
  completed: 'Trip completed',
  disputed: 'Dispute opened',
  resolved: 'Dispute resolved',
}

const OWNER_TEXT: Record<string, string> = {
  requested: 'New booking request',
  cancelled: 'Booking cancelled',
  disputed: 'Dispute opened',
  reviewed: 'New review',
}

export async function GET() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email ?? undefined

  const items: Item[] = []

  const announcements = await db.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  for (const a of announcements) {
    items.push({
      id: `a-${a.id}`,
      kind: 'announcement',
      title: a.title,
      body: a.message,
      href: '/',
      createdAt: a.createdAt.toISOString(),
    })
  }

  if (email) {
    const [asOwner, asRenter] = await Promise.all([
      db.booking.findMany({
        where: {
          owner: { email },
          status: { in: Object.keys(OWNER_TEXT) },
        },
        include: {
          car: { select: { make: true, model: true } },
          renter: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      db.booking.findMany({
        where: {
          renter: { email },
          status: { in: Object.keys(RENTER_TEXT) },
        },
        include: {
          car: { select: { make: true, model: true } },
          owner: { select: { name: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])

    for (const b of asOwner) {
      items.push({
        id: `o-${b.id}-${b.status}`,
        kind: 'booking',
        title: OWNER_TEXT[b.status],
        body: `${b.renter.name} · ${b.car.make} ${b.car.model}`,
        href: `/bookings/${b.id}`,
        createdAt: b.updatedAt.toISOString(),
      })
    }

    for (const b of asRenter) {
      items.push({
        id: `r-${b.id}-${b.status}`,
        kind: 'booking',
        title: RENTER_TEXT[b.status],
        body: `${b.car.make} ${b.car.model} · owner ${b.owner.name}`,
        href: `/bookings/${b.id}`,
        createdAt: b.updatedAt.toISOString(),
      })
    }
  }

  items.sort((x, y) => y.createdAt.localeCompare(x.createdAt))
  return NextResponse.json({ viewer: email ?? 'guest', items: items.slice(0, 10) })
}