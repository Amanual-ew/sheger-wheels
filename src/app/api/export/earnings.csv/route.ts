import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { toCSV, csvResponse } from '@/lib/csv'
import { formatDate } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return new Response('Not signed in', { status: 401 })
  }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) {
    return new Response('Owner access required', { status: 403 })
  }
  const ownerId = session.user.id
  const bookings = await db.booking.findMany({
    where: { ownerId, paymentStatus: 'paid' },
    include: { car: true, renter: { select: { name: true } } },
    orderBy: { startDate: 'desc' },
  })
  const rows = bookings.map((b) => ({
    id: b.id,
    car: `${b.car.make} ${b.car.model}`,
    renter: b.renter.name,
    startDate: b.startDate,
    endDate: b.endDate,
    days: b.days,
    gross: b.subtotal,
    fee: b.fee,
    net: b.subtotal - b.fee,
    status: b.status,
    paymentStatus: b.paymentStatus,
    created: formatDate(b.createdAt),
  }))
  const csv = toCSV(rows, [
    { key: 'id', label: 'Booking ID' },
    { key: 'car', label: 'Car' },
    { key: 'renter', label: 'Renter' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'days', label: 'Days' },
    { key: 'gross', label: 'Gross (ETB)' },
    { key: 'fee', label: 'Platform fee (ETB)' },
    { key: 'net', label: 'Net (ETB)' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment status' },
    { key: 'created', label: 'Created' },
  ])
  return csvResponse('sheggar-earnings.csv', csv)
}
