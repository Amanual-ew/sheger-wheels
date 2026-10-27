/**
 * Reusable formatting helpers. Used across server and client code.
 *
 * - ETB currency: 1,800 ETB (no decimals — the demo uses whole birr).
 * - Dates: ISO → human-friendly, with relative time helper.
 * - Numbers, status badges, etc.
 */

const ETB = new Intl.NumberFormat('en-ET', {
  style: 'currency',
  currency: 'ETB',
  maximumFractionDigits: 0,
})

export function formatETB(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value
  if (n === null || n === undefined || Number.isNaN(n)) return '— ETB'
  return ETB.format(n)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return new Intl.NumberFormat('en-ET').format(value)
}

export function formatDate(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-ET', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function relativeTime(iso: string | Date | null | undefined): string {
  if (!iso) return '—'
  const d = typeof iso === 'string' ? new Date(iso) : iso
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = d.getTime() - Date.now()
  const absSec = Math.abs(diffMs) / 1000
  const future = diffMs > 0
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  if (absSec < 60) return rtf.format(future ? absSec : -absSec, 'second')
  if (absSec < 3600) return rtf.format(future ? Math.round(absSec / 60) : -Math.round(absSec / 60), 'minute')
  if (absSec < 86400) return rtf.format(future ? Math.round(absSec / 3600) : -Math.round(absSec / 3600), 'hour')
  if (absSec < 2592000) return rtf.format(future ? Math.round(absSec / 86400) : -Math.round(absSec / 86400), 'day')
  if (absSec < 31536000) return rtf.format(future ? Math.round(absSec / 2592000) : -Math.round(absSec / 2592000), 'month')
  return rtf.format(future ? Math.round(absSec / 31536000) : -Math.round(absSec / 31536000), 'year')
}

export function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(startIso)
  const end = new Date(endIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)
}

export const BOOKING_STATUSES = [
  'requested', 'confirmed', 'in_progress', 'completed', 'reviewed',
  'declined', 'cancelled', 'disputed', 'resolved',
] as const
export type BookingStatus = typeof BOOKING_STATUSES[number]

export const CAR_STATUSES = ['draft', 'pending', 'approved', 'rejected', 'inactive'] as const
export type CarStatus = typeof CAR_STATUSES[number]

export const PAYMENT_STATUSES = ['unpaid', 'held', 'paid', 'refunded'] as const

export function statusBadgeClass(status: string): string {
  switch (status) {
    case 'approved':
    case 'confirmed':
    case 'paid':
    case 'completed':
    case 'reviewed':
    case 'resolved':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
    case 'pending':
    case 'requested':
    case 'held':
    case 'in_progress':
    case 'open':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
    case 'rejected':
    case 'declined':
    case 'cancelled':
    case 'refunded':
    case 'suspended':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
    case 'disputed':
      return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30'
    case 'inactive':
    case 'draft':
      return 'bg-zinc-500/15 text-zinc-700 dark:text-zinc-300 border-zinc-500/30'
    default:
      return 'bg-primary/10 text-primary border-primary/20'
  }
}

export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    requested: 'Requested',
    confirmed: 'Confirmed',
    in_progress: 'In progress',
    completed: 'Completed',
    reviewed: 'Reviewed',
    declined: 'Declined',
    cancelled: 'Cancelled',
    disputed: 'Disputed',
    resolved: 'Resolved',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    inactive: 'Inactive',
    draft: 'Draft',
    unpaid: 'Unpaid',
    held: 'Held',
    paid: 'Paid',
    refunded: 'Refunded',
    open: 'Open',
    active: 'Active',
    suspended: 'Suspended',
  }
  return map[status] ?? status
}
