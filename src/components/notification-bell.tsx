'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bell, Megaphone, CalendarCheck } from 'lucide-react'

type Item = {
  id: string
  kind: 'announcement' | 'booking'
  title: string
  body: string
  href: string
  createdAt: string
}

const SEEN_KEY = 'sheggar:notifications-seen'

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export function NotificationBell() {
  const [items, setItems] = useState<Item[]>([])
  const [viewer, setViewer] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [seenAt, setSeenAt] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setItems(data.items ?? [])
      setViewer(data.viewer ?? 'guest')
    } catch {}
  }, [])

  // The last-seen time is stored per signed-in user, not per browser.
  useEffect(() => {
    if (!viewer) return
    try {
      setSeenAt(Number(localStorage.getItem(`${SEEN_KEY}:${viewer}`) ?? 0))
    } catch {}
  }, [viewer])

  useEffect(() => {
    load()
    const timer = setInterval(load, 15000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [load])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const isUnread = (i: Item) => new Date(i.createdAt).getTime() > seenAt
  const unread = items.filter(isUnread).length

  function toggle() {
    const next = !open
    setOpen(next)
    if (next) {
      load()
      // Keep the unread dots visible while the panel is open;
      // mark everything as seen when it closes.
    } else {
      markSeen()
    }
  }

  function markSeen() {
    if (!viewer) return
    const now = Date.now()
    try {
      localStorage.setItem(`${SEEN_KEY}:${viewer}`, String(now))
    } catch {}
    setSeenAt(now)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-label={unread > 0 ? `Notifications, ${unread} new` : 'Notifications'}
        aria-expanded={open}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markSeen}
                className="text-xs text-primary hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              You&apos;re all caught up.
            </p>
          ) : (
            <ul className="max-h-96 divide-y overflow-y-auto">
              {items.map((i) => (
                <li key={i.id}>
                  <Link
                    href={i.href}
                    onClick={() => {
                      setOpen(false)
                      markSeen()
                    }}
                    className="flex gap-3 px-4 py-3 transition-colors hover:bg-muted/60"
                  >
                    <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                      {i.kind === 'announcement' ? (
                        <Megaphone className="h-4 w-4" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="block truncate text-sm font-medium">{i.title}</span>
                        {isUnread(i) && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
                        )}
                      </span>
                      <span className="line-clamp-2 text-xs text-muted-foreground">{i.body}</span>
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">
                        {timeAgo(i.createdAt)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}