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
  if (!Array.isArray(body.unavailableDates)) {
    return NextResponse.json({ error: 'unavailableDates must be an array' }, { status: 400 })
  }
  const cleaned = (body.unavailableDates as any[])
    .filter((d) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
  const updated = await db.car.update({
    where: { id },
    data: { unavailableDates: JSON.stringify(cleaned) },
  })
  await logActivity(session.user.id, 'car_availability_update', 'car', id, { count: cleaned.length })
  return NextResponse.json({ ok: true, unavailableDates: cleaned })
}
