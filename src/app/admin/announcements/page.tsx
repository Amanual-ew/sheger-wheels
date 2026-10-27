import { db } from '@/lib/db'
import { requireRole } from '@/lib/session'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { formatDateTime } from '@/lib/format'
import { AnnouncementForm } from './announcement-form'
import { AnnouncementActions } from './announcement-actions'
import { Inbox } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminAnnouncementsPage() {
  await requireRole('admin')
  const announcements = await db.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { name: true } } },
  })

  return (
    <div className="px-4 py-8 md:px-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Announcements</h1>
        <p className="text-sm text-muted-foreground">
          Broadcast platform-wide messages to signed-in users.
        </p>
      </header>

      <div className="max-w-3xl">
        <AnnouncementForm />

        <h2 className="text-sm font-semibold mt-8 mb-3">Existing announcements</h2>
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No announcements yet.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {announcements.map((a) => (
              <li key={a.id}>
                <Card className={a.active ? 'border-l-4 border-l-accent' : 'opacity-70'}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={a.active ? 'active' : 'inactive'} />
                          <p className="font-medium">{a.title}</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{a.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          By {a.createdBy?.name ?? 'system'} · {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                      <AnnouncementActions id={a.id} active={a.active} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}