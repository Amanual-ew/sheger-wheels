import { db } from '@/lib/db'
import { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sheggar-wheels.example'
  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/cars`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/signin`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ]
  const cars = await db.car.findMany({
    where: { status: 'approved' },
    select: { id: true, updatedAt: true },
  })
  const carEntries: MetadataRoute.Sitemap = cars.map((c) => ({
    url: `${baseUrl}/cars/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))
  return [...staticEntries, ...carEntries]
}
