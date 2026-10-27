import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { AdminNav } from '@/components/admin-nav'
import { formatDate } from '@/lib/format'
import { userRoles } from '@/lib/utils'
import { UserStatusActions } from '../user-status-actions'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  await requireRole('admin')
  const { id } = await params
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true,
      roles: true, status: true, createdAt: true,
      cars: { select: { id: true, make: true, model: true, status: true }, take: 10 },
      renterBookings: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, startDate: true, endDate: true, status: true, total: true, car: { select: { make: true, model: true } } },
      },
    },
  })
  if (!user) notFound()

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">User details</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </header>
      <AdminNav />

      <div className="grid gap-6 md:grid-cols-[1fr_240px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row label="Name" value={user.name} />
              <Row label="Email" value={user.email} />
              <Row label="Phone" value={user.phone || '—'} />
              <Row label="Status" value={<StatusBadge status={user.status} />} />
              <Row label="Roles" value={
                <div className="flex gap-1 flex-wrap justify-end">
                  {userRoles(user.roles).map((r) => (
                    <span key={r} className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">{r}</span>
                  ))}
                </div>
              } />
              <Row label="Joined" value={formatDate(user.createdAt)} />
            </CardContent>
          </Card>

          {user.cars.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cars ({user.cars.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {user.cars.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <Link href={`/cars/${c.id}`} className="font-medium hover:text-primary">{c.make} {c.model}</Link>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {user.renterBookings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent bookings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {user.renterBookings.map((b) => (
                    <li key={b.id} className="flex items-center gap-2">
                      <Link href={`/bookings/${b.id}`} className="font-medium hover:text-primary">
                        {b.car.make} {b.car.model}
                      </Link>
                      <span className="text-xs text-muted-foreground">{formatDate(b.startDate)}</span>
                      <StatusBadge status={b.status} />
                      <span className="ml-auto text-xs text-muted-foreground">ETB {b.total.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Account status</CardTitle>
            </CardHeader>
            <CardContent>
              <UserStatusActions userId={user.id} status={user.status} />
              <p className="text-xs text-muted-foreground mt-3">
                Suspending a user revokes all active sessions immediately.
                They will be unable to sign in.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  )
}
