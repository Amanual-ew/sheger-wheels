import Link from 'next/link'
import { Car } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-secondary/30">
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Car className="h-4 w-4" />
              </span>
              Sheggar Wheels
            </div>
            <p className="text-sm text-muted-foreground">
              A peer-to-peer car rental marketplace for Addis Ababa. Built as a
              portfolio capstone with Next.js, Prisma, and NextAuth.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Browse</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary" href="/">Home</Link></li>
              <li><Link className="hover:text-primary" href="/cars">All cars</Link></li>
              <li><Link className="hover:text-primary" href="/cars?neighbourhood=Bole">Cars in Bole</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Account</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li><Link className="hover:text-primary" href="/signin">Sign in</Link></li>
              <li><Link className="hover:text-primary" href="/signup">Create renter account</Link></li>
              <li><Link className="hover:text-primary" href="/dashboard">My trips</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Demo</h4>
            <p className="text-sm text-muted-foreground">
              All data is simulated. Bookings, payments, and map tracking are
              clearly labelled as demos. No real charges, no real GPS.
            </p>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 flex flex-col sm:flex-row justify-between gap-2 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Sheggar Wheels — Capstone demo project.</p>
          <p>Addis Ababa, Ethiopia · ETB prices shown</p>
        </div>
      </div>
    </footer>
  );
}
