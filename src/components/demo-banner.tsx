import { AlertTriangle } from 'lucide-react'

/**
 * Persistent banner that labels this app as a demo. The brief explicitly
 * requires a visible "Demo data" label so reviewers know the app is
 * simulated. We place it at the very top of every page.
 */
export function DemoBanner() {
  return (
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs">
      <div className="container mx-auto max-w-7xl px-4 py-1.5 flex items-center gap-2">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          Demo data — all cars, bookings, and payments are simulated. Demo password
          for all accounts: <code className="font-mono font-semibold">demo1234</code>.
        </span>
      </div>
    </div>
  );
}
