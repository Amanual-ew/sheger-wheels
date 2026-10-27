import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/actions/activity'

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { name, email, phone, password } = body as Record<string, string>
  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }
  if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) {
    return NextResponse.json({ error: 'Invalid email format.' }, { status: 400 })
  }
  const normalized = email.toLowerCase()
  const existing = await db.user.findUnique({ where: { email: normalized } })
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
  }

  const isAdminEmail = normalized === 'admin@shegerwheels.com'
  const roles = isAdminEmail ? ['admin'] : ['renter']
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: {
      name,
      email: normalized,
      phone: phone || null,
      passwordHash,
      roles: JSON.stringify(roles),
      status: 'active',
      mustChangePassword: false,
    },
  })
  await logActivity(user.id, 'signup', 'user', user.id, { email: normalized })
  return NextResponse.json({ ok: true, userId: user.id })
}
