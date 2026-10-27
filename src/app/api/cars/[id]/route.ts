import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { logActivity } from '@/lib/actions/activity'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }
  const { id } = await params
  const car = await db.car.findUnique({ where: { id } })
  if (!car) return NextResponse.json({ error: 'Car not found' }, { status: 404 })
  if (car.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Not your car' }, { status: 403 })
  }
  let body: any
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const updates: any = {}
  if (body.make !== undefined) updates.make = String(body.make).trim()
  if (body.model !== undefined) updates.model = String(body.model).trim()
  if (body.year !== undefined) {
    const y = Number(body.year)
    if (!Number.isFinite(y) || y < 1990 || y > new Date().getFullYear() + 1) {
      return NextResponse.json({ error: 'Invalid year' }, { status: 400 })
    }
    updates.year = y
  }
  if (body.transmission !== undefined) {
    if (!['automatic', 'manual'].includes(body.transmission)) {
      return NextResponse.json({ error: 'Invalid transmission' }, { status: 400 })
    }
    updates.transmission = body.transmission
  }
  if (body.seats !== undefined) {
    const s = Number(body.seats)
    if (!Number.isFinite(s) || s < 1 || s > 20) {
      return NextResponse.json({ error: 'Seats must be 1-20' }, { status: 400 })
    }
    updates.seats = s
  }
  if (body.fuel !== undefined) {
    if (!['petrol', 'diesel', 'hybrid', 'electric'].includes(body.fuel)) {
      return NextResponse.json({ error: 'Invalid fuel' }, { status: 400 })
    }
    updates.fuel = body.fuel
  }
  if (body.neighbourhood !== undefined) updates.neighbourhood = String(body.neighbourhood).trim()
  if (body.latitude !== undefined) updates.latitude = Number(body.latitude)
  if (body.longitude !== undefined) updates.longitude = Number(body.longitude)
  if (body.pricePerDay !== undefined) {
    const p = Number(body.pricePerDay)
    if (!Number.isFinite(p) || p < 100 || p > 100000) {
      return NextResponse.json({ error: 'Price must be 100-100000 ETB' }, { status: 400 })
    }
    updates.pricePerDay = p
  }
  if (body.description !== undefined) {
    updates.description = String(body.description).slice(0, 500)
  }
  if (Array.isArray(body.photos)) {
    updates.photos = JSON.stringify(body.photos.filter((p: any) => typeof p === 'string'))
  }
  // Owner can only change status between approved/inactive/draft. They cannot
  // unilaterally elevate a rejected/pending car back to approved.
  if (body.status !== undefined) {
    if (['approved', 'inactive', 'draft'].includes(body.status)) {
      // Only allow this self-transition if the current status is approved or inactive
      // (a draft or rejected car stays as-is — admin must approve).
      if (car.status === 'approved' || car.status === 'inactive') {
        updates.status = body.status
      }
    }
  }
  const updated = await db.car.update({ where: { id }, data: updates })
  await logActivity(session.user.id, 'car_update', 'car', id, {
    fields: Object.keys(updates),
  })
  return NextResponse.json({ ok: true, id: updated.id })
}