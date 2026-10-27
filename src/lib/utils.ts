import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parse a JSON-encoded string safely. If the value is missing or malformed,
 * return the fallback. Used for the Prisma-SQLite workaround that stores
 * arrays (photos, roles, unavailableDates) as JSON strings.
 */
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function userRoles(rolesJson: string | null | undefined): string[] {
  return safeJsonParse<string[]>(rolesJson, ['renter'])
}

export function carPhotos(photosJson: string | null | undefined): string[] {
  return safeJsonParse<string[]>(photosJson, [])
}

export function carUnavailableDates(json: string | null | undefined): string[] {
  return safeJsonParse<string[]>(json, [])
}

/** Generate a short transaction reference, e.g. "TB-7F3A9B2C". */
export function mockTransactionRef(): string {
  const rand = Math.random().toString(16).slice(2, 10).toUpperCase()
  return `TB-${rand}`
}

/** Stable placeholder image used when a car has no photos at all. */
export const FALLBACK_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#e2e8f0"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="#64748b" text-anchor="middle" dominant-baseline="middle">No photo</text>
    </svg>`,
  )

/** Client-safe version of the safe return path helper. Mirrors the server logic. */
export function getSafeReturnPath(value?: string | null): string {
  if (!value) return '/'
  // Disallow anything that isn't a same-origin path.
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')) {
    return value
  }
  return '/'
}
