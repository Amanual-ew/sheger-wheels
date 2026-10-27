import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { toCSV, csvResponse } from '@/lib/csv'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

/**
 * CSV export of the signed-in renter's own bookings. Only the bookings owned
 * by the current user are exported — this is the brief's "export only the
 * current user's permitted demo data" rule.
 */
export async function GET(_req: NextRequest) {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return new Response('Not signed in', { status: 401 })
  }
  const bookings = await db.booking.findMany({
    where: { renterId: session.user.id },
    include: { car: true },
    orderBy: { startDate: 'desc' },
  })
  const rows = bookings.map((b) => ({
    id: b.id,
    car: `${b.car.make} ${b.car.model}`,
    startDate: b.startDate,
    endDate: b.endDate,
    days: b.days,
    pricePerDay: b.pricePerDay,
    subtotal: b.subtotal,
    fee: b.fee,
    total: b.total,
    status: b.status,
    paymentStatus: b.paymentStatus,
    created: formatDate(b.createdAt),
  }))
  const csv = toCSV(rows, [
    { key: 'id', label: 'Booking ID' },
    { key: 'car', label: 'Car' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'days', label: 'Days' },
    { key: 'pricePerDay', label: 'Price/day (ETB)' },
    { key: 'subtotal', label: 'Subtotal (ETB)' },
    { key: 'fee', label: 'Platform fee (ETB)' },
    { key: 'total', label: 'Total (ETB)' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment status' },
    { key: 'created', label: 'Created' },
  ])
  return csvResponse('sheggar-bookings.csv', csv)
}
