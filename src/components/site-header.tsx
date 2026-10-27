'use client'

import Link from 'next/link'
import { NotificationBell } from '@/components/notification-bell'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useEffect, useState } from 'react'
import {
  Car, LayoutDashboard, LogOut, Menu, Shield, User, PlusCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/theme-toggle'

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/cars', label: 'Browse cars' },
]

function isActive(href: string, pathname: string) {
  return href === '/'
    ? pathname === '/'
    : pathname === href || pathname.startsWith(href + '/')
}

function desktopLinkClass(href: string, pathname: string) {
  return cn(
    'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
    isActive(href, pathname)
      ? 'bg-primary/10 text-primary'
      : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
  )
}

function mobileLinkClass(href: string, pathname: string) {
  return cn(
    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    isActive(href, pathname)
      ? 'bg-primary/10 text-primary'
      : 'text-foreground hover:bg-accent',
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const roles = (session?.user as { roles?: string[] } | undefined)?.roles
  const isLoading = status === 'loading'
  const isAuthed = status === 'authenticated'
  const isOwner = !!roles?.includes('owner')
  const isAdmin = !!roles?.includes('admin')
  const isRenter = !!roles?.includes('renter')

  const userName = session?.user?.name ?? 'Account'
  const initial = userName.charAt(0).toUpperCase()

  // e.g. "Admin", "Owner", or "Owner · Renter" for users with several roles
  const roleLabel = [
    isAdmin && 'Admin',
    isOwner && 'Owner',
    isRenter && 'Renter',
  ]
    .filter(Boolean)
    .join(' · ')

  const closeMobile = () => setMobileOpen(false)

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-200',
        scrolled
          ? 'border-border bg-background/80 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-background/60 backdrop-blur-md',
      )}
    >
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4 md:grid md:grid-cols-[1fr_auto_1fr]">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2.5 justify-self-start text-lg font-bold tracking-tight"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
              <Car className="h-5 w-5" />
            </span>
            <span className="hidden sm:inline">Sheggar Wheels</span>
            <span className="sm:hidden">Sheggar</span>
          </Link>

          {/* Desktop nav: pill group, truly centred */}
          <nav className="hidden items-center gap-1 rounded-full border bg-background/60 p-1 md:flex">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className={desktopLinkClass(l.href, pathname)}>
                {l.label}
              </Link>
            ))}
            {isAuthed && isRenter && (
              <Link href="/dashboard" className={desktopLinkClass('/dashboard', pathname)}>
                Renter
              </Link>
            )}
            {isAuthed && isOwner && (
              <Link href="/owner" className={desktopLinkClass('/owner', pathname)}>
                Owner
              </Link>
            )}
            {isAuthed && isAdmin && (
              <Link href="/admin" className={desktopLinkClass('/admin', pathname)}>
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center justify-self-end gap-2 md:flex">
            {isAuthed && <NotificationBell />}
            <ThemeToggle />
            {isLoading ? (
              // Placeholder while the session loads, so signed-in users
              // don't see a flash of "Sign in / Sign up"
              <div className="flex items-center gap-2" aria-hidden>
                <div className="h-8 w-16 animate-pulse rounded-full bg-muted" />
                <div className="h-8 w-20 animate-pulse rounded-full bg-muted" />
              </div>
            ) : isAuthed ? (
              <>
                {isOwner && (
                  <Button asChild size="sm" className="rounded-full">
                    <Link href="/owner/cars/new">
                      <PlusCircle className="mr-1 h-4 w-4" /> List a car
                    </Link>
                  </Button>
                )}
                <div
                  className="flex items-center gap-2 rounded-full border bg-background/60 py-1 pl-1 pr-3"
                  title={roleLabel ? `${userName} · ${roleLabel}` : userName}
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {initial}
                  </span>
                  <span className="hidden min-w-0 flex-col leading-tight lg:flex">
                    <span className="max-w-[110px] truncate text-sm font-medium">
                      {userName}
                    </span>
                    {roleLabel && (
                      <span className="max-w-[110px] truncate text-[11px] text-muted-foreground">
                        {roleLabel}
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  <LogOut className="mr-1 h-4 w-4" /> Sign out
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="rounded-full">
                  <Link href="/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="rounded-full px-5 shadow-sm">
                  <Link href="/signup">Sign up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile: bell and theme toggle stay visible next to the menu button */}
          <div className="flex items-center gap-1 md:hidden">
            {isAuthed && <NotificationBell />}
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription className="sr-only">
                    Site navigation and account actions
                  </SheetDescription>
                </SheetHeader>

                <div className="mt-2 flex flex-col gap-1 px-2">
                  {isAuthed && (
                    <div className="mb-2 flex items-center gap-3 rounded-xl border bg-muted/40 p-3">
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                        {initial}
                      </span>
                      <div className="flex min-w-0 flex-col leading-tight">
                        <span className="truncate text-sm font-medium">{userName}</span>
                        {roleLabel && (
                          <span className="truncate text-xs text-muted-foreground">
                            {roleLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {PUBLIC_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={closeMobile}
                      className={mobileLinkClass(l.href, pathname)}
                    >
                      {l.label}
                    </Link>
                  ))}
                  {isAuthed && isRenter && (
                    <Link href="/dashboard" onClick={closeMobile} className={mobileLinkClass('/dashboard', pathname)}>
                      <LayoutDashboard className="h-4 w-4" /> Renter dashboard
                    </Link>
                  )}
                  {isAuthed && isOwner && (
                    <Link href="/owner" onClick={closeMobile} className={mobileLinkClass('/owner', pathname)}>
                      <User className="h-4 w-4" /> Owner dashboard
                    </Link>
                  )}
                  {isAuthed && isAdmin && (
                    <Link href="/admin" onClick={closeMobile} className={mobileLinkClass('/admin', pathname)}>
                      <Shield className="h-4 w-4" /> Admin dashboard
                    </Link>
                  )}

                  <div className="my-2 border-t" />

                  {isLoading ? null : isAuthed ? (
                    <>
                      {isOwner && (
                        <Button asChild size="sm" className="justify-start rounded-lg">
                          <Link href="/owner/cars/new" onClick={closeMobile}>
                            <PlusCircle className="mr-1 h-4 w-4" /> List a car
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-start rounded-lg"
                        onClick={() => {
                          closeMobile()
                          signOut({ callbackUrl: '/' })
                        }}
                      >
                        <LogOut className="mr-1 h-4 w-4" /> Sign out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button asChild variant="outline" size="sm" className="justify-start rounded-lg">
                        <Link href="/signin" onClick={closeMobile}>Sign in</Link>
                      </Button>
                      <Button asChild size="sm" className="justify-start rounded-lg">
                        <Link href="/signup" onClick={closeMobile}>Sign up</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}