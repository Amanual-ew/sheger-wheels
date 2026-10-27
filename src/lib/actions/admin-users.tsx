'use server'

import 'server-only'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

// Roles an admin is allowed to hand out from the "Add user" form.
// 'admin' is deliberately NOT here.
const ASSIGNABLE_ROLES = ['owner', 'renter'] as const
type AssignableRole = (typeof ASSIGNABLE_ROLES)[number]

export type AdminCreateUserInput = {
  name: string
  email: string
  phone?: string
  password: string
  roles: string[]
}

export async function adminCreateUserAction(
  input: AdminCreateUserInput,
): Promise<{ error?: string; userId?: string }> {
  // 1. Only admins.
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const sessionRoles = (session.user as any).roles as string[] | undefined
  if (!sessionRoles?.includes('admin')) {
    return { error: 'Only admins can create users.' }
  }

  // 2. Validate (the client checks too, but never trust the client).
  const name = (input.name ?? '').trim()
  const email = (input.email ?? '').trim().toLowerCase()
  const phone = (input.phone ?? '').trim()
  const password = input.password ?? ''

  if (!name) return { error: 'Please enter the full name.' }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: 'Please enter a valid email address.' }
  }
  if (phone && !/^\+?[0-9\s-]{6,20}$/.test(phone)) {
    return { error: 'Please enter a valid phone number.' }
  }
  if (password.length < 8) {
    return { error: 'The password must be at least 8 characters.' }
  }

  // 3. Roles: whitelist, de-duplicate, at least one.
  const roles = Array.from(
    new Set(
      (input.roles ?? []).filter((r): r is AssignableRole =>
        (ASSIGNABLE_ROLES as readonly string[]).includes(r),
      ),
    ),
  )
  if (roles.length === 0) return { error: 'Choose at least one role (owner or renter).' }

  // 4. Duplicate email.
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: 'An account with that email already exists.' }

  // 5. Create (same hashing as /api/signup).
  const passwordHash = await bcrypt.hash(password, 10)
  const user = await db.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash,
      roles: JSON.stringify(roles),
      status: 'active',
       mustChangePassword: true,
    },
  })

  await logActivity(session.user.id, 'admin_create_user', 'user', user.id, { email, roles })
  revalidatePath('/admin/users')
  return { userId: user.id }
}