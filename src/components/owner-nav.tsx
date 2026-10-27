'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Car, LayoutDashboard, DollarSign, Star, AlertTriangle, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/owner', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/owner/cars', label: 'My cars', icon: Car },
  { href: '/owner/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/owner/reviews', label: 'Reviews', icon: Star },
  { href: '/owner/disputes', label: 'Disputes', icon: AlertTriangle },
]

export function OwnerNav() {
  const pathname = usePathname()
  return (
    <nav
      className="flex gap-1 overflow-x-auto scroll-thin mb-6 border-b"
      aria-label="Owner navigation"
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
