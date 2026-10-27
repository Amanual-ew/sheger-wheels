'use client'

import { usePathname } from 'next/navigation'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdmin && <SiteHeader />}
      <main className="flex-1">{children}</main>
      {!isAdmin && <SiteFooter />}
    </div>
  )
}