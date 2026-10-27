'use server'

import 'server-only'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

const ADMIN_CAR_STATUSES = ['approved', 'rejected', 'inactive']

export async function moderateCarAction(
  carId: string,
  newStatus: 'approved' | 'rejected',
  reason?: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = session.user.roles ?? []
  if (!roles.includes('admin')) return { error: 'Only admins can moderate cars.' }
  if (!ADMIN_CAR_STATUSES.includes(newStatus)) {
    return { error: 'Invalid target status.' }
  }
  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car) return { error: 'Car not found.' }
  await db.car.update({ where: { id: carId }, data: { status: newStatus } })
  await logActivity(session.user.id, `car_${newStatus}`, 'car', carId, { reason })
  revalidatePath('/admin/listings')
  revalidatePath(`/cars/${carId}`)
  revalidatePath('/cars')
  return {}
}

export async function setUserStatusAction(
  userId: string,
  newStatus: 'active' | 'suspended',
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = session.user.roles ?? []
  if (!roles.includes('admin')) return { error: 'Only admins can suspend users.' }
  if (userId === session.user.id) return { error: 'You cannot change your own status.' }
  const user = await db.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User not found.' }
  await db.user.update({ where: { id: userId }, data: { status: newStatus } })
  // Revoke all sessions for the user (so suspensions take effect immediately).
  await db.session.deleteMany({ where: { userId } })
  await logActivity(session.user.id, `user_${newStatus}`, 'user', userId, {})
  revalidatePath('/admin/users')
  revalidatePath(`/admin/users/${userId}`)
  return {}
}

export async function publishAnnouncementAction(
  title: string,
  message: string,
  active: boolean,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = session.user.roles ?? []
  if (!roles.includes('admin')) return { error: 'Only admins can publish announcements.' }
  if (!title.trim() || !message.trim()) return { error: 'Title and message are required.' }
  const created = await db.announcement.create({
    data: {
      title: title.trim(),
      message: message.trim(),
      active,
      createdById: session.user.id,
    },
  })
  await logActivity(session.user.id, 'announcement_publish', 'announcement', created.id, { title })
  revalidatePath('/admin/announcements')
  revalidatePath('/')
  revalidatePath('/dashboard')
  return {}
}

export async function toggleAnnouncementAction(
  announcementId: string,
  active: boolean,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = session.user.roles ?? []
  if (!roles.includes('admin')) return { error: 'Only admins can manage announcements.' }
  await db.announcement.update({
    where: { id: announcementId },
    data: { active },
  })
  await logActivity(session.user.id, 'announcement_toggle', 'announcement', announcementId, { active })
  revalidatePath('/admin/announcements')
  revalidatePath('/')
  revalidatePath('/dashboard')
  return {}
}

export async function deleteAnnouncementAction(
  announcementId: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = session.user.roles ?? []
  if (!roles.includes('admin')) return { error: 'Only admins can delete announcements.' }
  await db.announcement.delete({ where: { id: announcementId } })
  await logActivity(session.user.id, 'announcement_delete', 'announcement', announcementId, {})
  revalidatePath('/admin/announcements')
  revalidatePath('/')
  return {}
}