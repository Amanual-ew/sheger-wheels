import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { logActivity } from '@/lib/actions/activity'

export async function POST(req: NextRequest) {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) {
    return NextResponse.json({ error: 'Only owner accounts can create cars' }, { status: 403 })
  }
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const required = ['make', 'model', 'year', 'transmission', 'seats', 'fuel', 'neighbourhood', 'latitude', 'longitude', 'pricePerDay']
  for (const f of required) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      return NextResponse.json({ error: `Missing field: ${f}` }, { status: 400 })
    }
  }
  if (!['automatic', 'manual'].includes(body.transmission)) {
    return NextResponse.json({ error: 'Invalid transmission' }, { status: 400 })
  }
  if (!['petrol', 'diesel', 'hybrid', 'electric'].includes(body.fuel)) {
    return NextResponse.json({ error: 'Invalid fuel' }, { status: 400 })
  }
  const year = Number(body.year)
  const seats = Number(body.seats)
  const pricePerDay = Number(body.pricePerDay)
  if (year < 1990 || year > new Date().getFullYear() + 1) {
    return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
  }
  if (seats < 1 || seats > 20) {
    return NextResponse.json({ error: 'Seats must be 1-20' }, { status: 400 })
  }
  if (pricePerDay < 100 || pricePerDay > 100000) {
    return NextResponse.json({ error: 'Price must be 100-100000 ETB' }, { status: 400 })
  }
  // New listings always start as 'pending' regardless of what the form sends.
  const car = await db.car.create({
    data: {
      ownerId: session.user.id,
      make: String(body.make).trim(),
      model: String(body.model).trim(),
      year,
      transmission: body.transmission,
      seats,
      fuel: body.fuel,
      neighbourhood: String(body.neighbourhood).trim(),
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
      pricePerDay,
      description: String(body.description ?? '').slice(0, 500),
      photos: JSON.stringify(Array.isArray(body.photos) ? body.photos : []),
      status: 'pending',
    },
  })
  await logActivity(session.user.id, 'car_create', 'car', car.id, { make: car.make, model: car.model })
  return NextResponse.json({ ok: true, id: car.id })
}
