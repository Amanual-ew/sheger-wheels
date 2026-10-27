import { neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL)
}

if (!process.env.DATABASE_URL) {
  console.warn(
    'DATABASE_URL is not configured. Database-backed features will be unavailable until Vercel environment variables are set.',
  )
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db