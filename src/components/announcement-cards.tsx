import { db } from '@/lib/db'
import { formatDate } from '@/lib/format'
import { Megaphone } from 'lucide-react'

async function getActiveAnnouncements() {
  const items = await db.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  })
  return items
}

export async function AnnouncementCards() {
  const items = await getActiveAnnouncements()
  if (items.length === 0) return null

  return (
    <section aria-label="Announcements" className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => {
        const isNew =
          Date.now() - new Date(a.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000

        return (
          <article
            key={a.id}
            className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-accent/15 via-card to-primary/10 p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-accent/20 blur-2xl"
            />

            <div className="relative flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-sm">
                <Megaphone className="h-4 w-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  {isNew && (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                      New
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(a.createdAt)}
                  </span>
                </div>

                <h3 className="text-sm font-bold leading-snug">{a.title}</h3>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                  {a.message}
                </p>
              </div>
            </div>
          </article>
        )
      })}
    </section>
  )
}

export { getActiveAnnouncements }