import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { formatDate } from '@/lib/format'
import { userRoles } from '@/lib/utils'
import Link from 'next/link'
import { Inbox, UserPlus } from 'lucide-react'
import { UserStatusActions } from './user-status-actions'

export const dynamic = 'force-dynamic'

type SearchParams = { status?: string }

export default async function AdminUsersPage({
  searchParams,
}: { searchParams: Promise<SearchParams> }) {
  await requireRole('admin')
  const sp = await searchParams
  const statusFilter = sp.status ?? 'all'

  const where: any = {}
  if (statusFilter !== 'all') where.status = statusFilter

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, email: true, phone: true,
      roles: true, status: true, createdAt: true,
      _count: { select: { cars: true, renterBookings: true } },
    },
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} user{users.length === 1 ? '' : 's'}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/admin/users/new">
            <UserPlus className="mr-1 h-4 w-4" /> Add user
          </Link>
        </Button>
      </header>

      <div className="mb-4 flex gap-1 flex-wrap text-xs">
        {['all', 'active', 'suspended'].map((s) => (
          <Button key={s} asChild size="sm" variant={statusFilter === s ? 'default' : 'outline'}>
            <Link href={`/admin/users?status=${s}`} className="capitalize">{s}</Link>
          </Button>
        ))}
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No users found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Roles</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Cars</th>
                <th className="py-2 pr-3">Bookings</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 pr-3">
                    <Link href={`/admin/users/${u.id}`} className="font-medium hover:text-primary">
                      {u.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex gap-1 flex-wrap">
                      {userRoles(u.roles).map((r) => (
                        <span key={r} className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 pr-3"><StatusBadge status={u.status} /></td>
                  <td className="py-3 pr-3">{u._count.cars}</td>
                  <td className="py-3 pr-3">{u._count.renterBookings}</td>
                  <td className="py-3 pr-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="py-3 pr-3 text-right">
                    <UserStatusActions userId={u.id} status={u.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}