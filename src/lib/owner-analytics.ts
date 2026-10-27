import 'server-only'
import { db } from '@/lib/db'
import { formatETB } from '@/lib/format'

type MonthBucket = { label: string; earnings: number; bookings: number }

/** Aggregate paid bookings by month for the last 6 months for an owner. */
export async function getOwnerEarningsSeries(ownerId: string): Promise<MonthBucket[]> {
  const now = new Date()
  const buckets: { year: number; month: number; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    buckets.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString('en', { month: 'short' }),
    })
  }
  const since = new Date(buckets[0].year, buckets[0].month, 1).toISOString()
  const bookings = await db.booking.findMany({
    where: { ownerId, paymentStatus: 'paid', createdAt: { gte: since } },
    select: { subtotal: true, createdAt: true },
  })
  return buckets.map((b) => {
    const monthBookings = bookings.filter((bk) => {
      const dt = new Date(bk.createdAt)
      return dt.getFullYear() === b.year && dt.getMonth() === b.month
    })
    return {
      label: b.label,
      earnings: monthBookings.reduce((s, bk) => s + bk.subtotal, 0),
      bookings: monthBookings.length,
    }
  })
}

export async function getOwnerEarningsSummary(ownerId: string) {
  const agg = await db.booking.aggregate({
    where: { ownerId, paymentStatus: 'paid' },
    _sum: { subtotal: true, fee: true, total: true },
    _count: true,
  })
  return {
    gross: agg._sum.subtotal ?? 0,
    fee: agg._sum.fee ?? 0,
    net: (agg._sum.subtotal ?? 0) - (agg._sum.fee ?? 0),
    bookings: agg._count ?? 0,
  }
}

export async function getOwnerEarningsBreakdown(ownerId: string) {
  const cars = await db.car.findMany({
    where: { ownerId },
    include: {
      bookings: {
        where: { paymentStatus: 'paid' },
        select: { subtotal: true, days: true },
      },
    },
  })
  return cars.map((c) => {
    const earnings = c.bookings.reduce((s, b) => s + b.subtotal, 0)
    const bookedDays = c.bookings.reduce((s, b) => s + b.days, 0)
    return {
      carId: c.id,
      make: c.make,
      model: c.model,
      pricePerDay: c.pricePerDay,
      bookings: c.bookings.length,
      earnings,
      bookedDays,
    }
  })
}

export { formatETB }
