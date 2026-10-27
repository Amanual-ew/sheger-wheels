'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, Users, CalendarDays, AlertTriangle, Download, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/listings', label: 'Listings', icon: Car },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
  { href: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { href: '/admin/reports', label: 'Reports', icon: Download },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav
      className="flex gap-1 overflow-x-auto scroll-thin mb-6 border-b"
      aria-label="Admin navigation"
    >
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname === l.href || pathname.startsWith(l.href + '/')
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap',
              active
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        )
      })}
    </nav>
  )
}
