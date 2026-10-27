'use server'

import 'server-only'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { logActivity } from './activity'

export async function changePasswordAction(
  currentPassword: string,
  newPassword: string,
): Promise<{ error?: string }> {
  // allowMustChange: this is the one action a flagged account may use.
  const session = await getCurrentSession({ allowMustChange: true })
  if (!session?.user?.id) return { error: 'Not signed in.' }

  if (!currentPassword) return { error: 'Please enter your current password.' }
  if (newPassword.length < 8) {
    return { error: 'The new password must be at least 8 characters.' }
  }
  if (newPassword === currentPassword) {
    return { error: 'The new password must be different from the current one.' }
  }

  const user = await db.user.findUnique({ where: { id: session.user.id } })
  if (!user || !user.passwordHash) return { error: 'Account not found.' }

  const ok = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!ok) return { error: 'Your current password is not correct.' }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash, mustChangePassword: false },
  })

  await logActivity(user.id, 'password_change', 'user', user.id, {})
  return {}
}