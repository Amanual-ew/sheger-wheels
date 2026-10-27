import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { toCSV, csvResponse } from '@/lib/csv'
import { formatDate, formatDateTime } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest) {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return new Response('Not signed in', { status: 401 })
  }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('admin')) {
    return new Response('Admin access required', { status: 403 })
  }
  const [
    users, cars, bookings, disputes, announcements, activityLogs,
  ] = await Promise.all([
    db.user.findMany({
      select: { id: true, name: true, email: true, roles: true, status: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.car.findMany({
      select: { id: true, make: true, model: true, year: true, status: true, pricePerDay: true, ownerId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.booking.findMany({
      select: { id: true, carId: true, renterId: true, ownerId: true, startDate: true, endDate: true, days: true, total: true, status: true, paymentStatus: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.dispute.findMany({
      select: { id: true, bookingId: true, openedBy: true, reason: true, status: true, createdAt: true, resolvedAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.announcement.findMany({
      select: { id: true, title: true, active: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    db.activityLog.findMany({
      select: { id: true, userId: true, action: true, targetType: true, targetId: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  const sections: { name: string; rows: Record<string, unknown>[]; columns: { key: string; label: string }[] }[] = [
    {
      name: 'Users',
      rows: users.map((u) => ({ ...u, roles: u.roles, createdAt: formatDateTime(u.createdAt) })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'roles', label: 'Roles' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created' },
      ],
    },
    {
      name: 'Cars',
      rows: cars.map((c) => ({ ...c, createdAt: formatDateTime(c.createdAt) })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'make', label: 'Make' },
        { key: 'model', label: 'Model' },
        { key: 'year', label: 'Year' },
        { key: 'status', label: 'Status' },
        { key: 'pricePerDay', label: 'Price/day (ETB)' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'createdAt', label: 'Created' },
      ],
    },
    {
      name: 'Bookings',
      rows: bookings.map((b) => ({ ...b, createdAt: formatDateTime(b.createdAt) })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'carId', label: 'Car ID' },
        { key: 'renterId', label: 'Renter ID' },
        { key: 'ownerId', label: 'Owner ID' },
        { key: 'startDate', label: 'Start' },
        { key: 'endDate', label: 'End' },
        { key: 'days', label: 'Days' },
        { key: 'total', label: 'Total (ETB)' },
        { key: 'status', label: 'Status' },
        { key: 'paymentStatus', label: 'Payment' },
        { key: 'createdAt', label: 'Created' },
      ],
    },
    {
      name: 'Disputes',
      rows: disputes.map((d) => ({ ...d, createdAt: formatDateTime(d.createdAt), resolvedAt: d.resolvedAt ? formatDateTime(d.resolvedAt) : '' })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'bookingId', label: 'Booking ID' },
        { key: 'openedBy', label: 'Opened by' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status' },
        { key: 'createdAt', label: 'Created' },
        { key: 'resolvedAt', label: 'Resolved' },
      ],
    },
    {
      name: 'Announcements',
      rows: announcements.map((a) => ({ ...a, createdAt: formatDateTime(a.createdAt) })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'title', label: 'Title' },
        { key: 'active', label: 'Active' },
        { key: 'createdAt', label: 'Created' },
      ],
    },
    {
      name: 'ActivityLog',
      rows: activityLogs.map((a) => ({ ...a, createdAt: formatDateTime(a.createdAt) })),
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'userId', label: 'User ID' },
        { key: 'action', label: 'Action' },
        { key: 'targetType', label: 'Target type' },
        { key: 'targetId', label: 'Target ID' },
        { key: 'createdAt', label: 'Created' },
      ],
    },
  ]

  // Combine all sections into one CSV file with section headers.
  const parts: string[] = []
  for (const s of sections) {
    parts.push(`# ${s.name} (${s.rows.length})`)
    parts.push(toCSV(s.rows, s.columns))
    parts.push('')
  }
  const csv = `\uFEFF${parts.join('\n')}`
  return csvResponse(`sheggar-platform-report-${formatDate(new Date().toISOString())}.csv`, csv)
}
