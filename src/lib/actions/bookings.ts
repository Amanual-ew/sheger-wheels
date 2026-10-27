'use server'

import 'server-only'
import { db } from '@/lib/db'
import { getCurrentSession } from '@/lib/session'
import { daysBetween } from '@/lib/format'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

const PLATFORM_FEE_RATE = 0.10

// Allowed transitions (server-enforced).
const NEXT_STATUSES: Record<string, string[]> = {
  requested: ['confirmed', 'declined', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'disputed'],
  completed: ['reviewed'],
  disputed: ['resolved'],
}

function canTransition(from: string, to: string): boolean {
  return NEXT_STATUSES[from]?.includes(to) ?? false
}

// True if the renter has already put money into the booking.
function hasMoneyIn(paymentStatus: string): boolean {
  return paymentStatus === 'held' || paymentStatus === 'paid'
}

async function assertBookingOwnership(
  bookingId: string,
  userRole: 'renter' | 'owner',
  userId: string,
) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' as const }
  const ownerField = userRole === 'renter' ? 'renterId' : 'ownerId'
  if (booking[ownerField] !== userId) {
    return { error: 'This booking does not belong to you.' as const, booking }
  }
  return { booking }
}

export async function requestBookingAction(
  carId: string,
  startDateIso: string,
  endDateIso: string,
  notes?: string,
): Promise<{ error?: string; bookingId?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) {
    return { error: 'Not signed in. Please sign in to request a booking.' }
  }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('renter')) {
    return { error: 'Only renter accounts can request bookings.' }
  }

  const start = new Date(startDateIso)
  const end = new Date(endDateIso)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return { error: 'Please pick a valid date range.' }
  }

  const car = await db.car.findUnique({ where: { id: carId } })
  if (!car || car.status !== 'approved') {
    return { error: 'This car is not available for booking.' }
  }

  const unavailableDates: string[] = JSON.parse(car.unavailableDates || '[]')
  const requestedRange = eachDay(start, end)
  const conflict = requestedRange.find((d) =>
    unavailableDates.includes(d.toISOString().slice(0, 10)),
  )
  if (conflict) {
    return { error: 'One of your selected dates is marked unavailable for this car.' }
  }

  const overlapping = await db.booking.findFirst({
    where: {
      carId,
      status: { in: ['requested', 'confirmed', 'in_progress'] },
      AND: [
        { startDate: { lte: endDateIso } },
        { endDate: { gte: startDateIso } },
      ],
    },
  })
  if (overlapping) {
    return { error: 'Those dates overlap with an existing active booking for this car.' }
  }

  const days = daysBetween(startDateIso, endDateIso)
  const subtotal = car.pricePerDay * days
  const fee = subtotal * PLATFORM_FEE_RATE
  const total = subtotal + fee

  const booking = await db.booking.create({
    data: {
      carId,
      renterId: session.user.id,
      ownerId: car.ownerId,
      startDate: startDateIso,
      endDate: endDateIso,
      days,
      pricePerDay: car.pricePerDay,
      subtotal,
      fee,
      total,
      paymentStatus: 'unpaid',
      status: 'requested',
      notes: notes || null,
    },
  })
  await logActivity(session.user.id, 'booking_create', 'booking', booking.id, { carId })
  revalidatePath('/owner')
  revalidatePath('/dashboard')
  return { bookingId: booking.id }
}

export async function respondToBookingAction(
  bookingId: string,
  action: 'approve' | 'decline',
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) return { error: 'Only owners can respond to bookings.' }

  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.ownerId !== session.user.id) {
    return { error: 'This booking is not on one of your cars.' }
  }
  const next = action === 'approve' ? 'confirmed' : 'declined'
  if (!canTransition(booking.status, next)) {
    return { error: `Cannot ${action} a booking in status ${booking.status}.` }
  }

  // Approving never touches payment: the renter pays AFTER approval.
  // Declining only refunds if money was actually taken.
  await db.booking.update({
    where: { id: bookingId },
    data:
      action === 'approve'
        ? { status: 'confirmed' }
        : {
            status: 'declined',
            ...(hasMoneyIn(booking.paymentStatus)
              ? { paymentStatus: 'refunded', payoutStatus: 'pending' }
              : {}),
          },
  })
  await logActivity(session.user.id, `booking_${next}`, 'booking', bookingId, {})
  revalidatePath(`/owner/cars/${booking.carId}/bookings`)
  revalidatePath(`/bookings/${bookingId}`)
  return {}
}

export async function cancelBookingAction(
  bookingId: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const { error, booking } = await assertBookingOwnership(bookingId, 'renter', session.user.id)
  if (error) return { error }
  if (!booking) return { error: 'Booking not found.' }
  if (!canTransition(booking.status, 'cancelled')) {
    return { error: `Cannot cancel a booking in status ${booking.status}.` }
  }

  // Only mark as refunded if money was actually taken.
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'cancelled',
      ...(hasMoneyIn(booking.paymentStatus) ? { paymentStatus: 'refunded' } : {}),
    },
  })
  await logActivity(session.user.id, 'booking_cancel', 'booking', bookingId, {})
  revalidatePath('/dashboard')
  revalidatePath(`/bookings/${bookingId}`)
  return {}
}

export async function completeMockPaymentAction(
  bookingId: string,
): Promise<{ error?: string; transactionRef?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const { error, booking } = await assertBookingOwnership(bookingId, 'renter', session.user.id)
  if (error) return { error }
  if (!booking) return { error: 'Booking not found.' }

  // Payment is only allowed after the owner has approved the booking.
  if (booking.status !== 'confirmed') {
    return {
      error:
        booking.status === 'requested'
          ? 'The owner must approve this booking before you can pay.'
          : `Cannot pay for a booking in status ${booking.status}.`,
    }
  }
  if (booking.paymentStatus !== 'unpaid') {
    return { error: 'This booking has already been paid.' }
  }

  // Payee is always read from the database, never from the client.
  const owner = await db.user.findUnique({
    where: { id: booking.ownerId },
    select: { phone: true },
  })

  const transactionRef = `TB-${Math.random().toString(16).slice(2, 10).toUpperCase()}`
  await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: 'held', // platform holds the money until the rental completes
      payeePhone: owner?.phone ?? null,
      payoutAmount: booking.subtotal, // owner gets the subtotal; platform keeps the fee
      payoutStatus: 'pending',
      transactionRef,
    },
  })
  await logActivity(session.user.id, 'booking_payment', 'booking', bookingId, { transactionRef })
  revalidatePath(`/bookings/${bookingId}`)
  return { transactionRef }
}

export async function startRentalAction(
  bookingId: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) return { error: 'Only owners can start rentals.' }
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.ownerId !== session.user.id) return { error: 'Not your booking.' }
  if (!canTransition(booking.status, 'in_progress')) {
    return { error: `Cannot start a booking in status ${booking.status}.` }
  }
  if (!hasMoneyIn(booking.paymentStatus)) {
    return { error: 'The renter has not paid yet.' }
  }
  await db.booking.update({ where: { id: bookingId }, data: { status: 'in_progress' } })
  await logActivity(session.user.id, 'booking_start', 'booking', bookingId, {})
  revalidatePath(`/bookings/${bookingId}`)
  return {}
}

export async function completeRentalAction(
  bookingId: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) return { error: 'Only owners can complete rentals.' }
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.ownerId !== session.user.id) return { error: 'Not your booking.' }
  if (!canTransition(booking.status, 'completed')) {
    return { error: `Cannot complete a booking in status ${booking.status}.` }
  }

  // Rental done: release the held money to the owner (mock payout).
  await db.booking.update({
    where: { id: bookingId },
    data: {
      status: 'completed',
      ...(booking.paymentStatus === 'held'
        ? { paymentStatus: 'paid', payoutStatus: 'sent' }
        : {}),
    },
  })
  await logActivity(session.user.id, 'booking_complete', 'booking', bookingId, {
    payoutAmount: booking.payoutAmount,
    payeePhone: booking.payeePhone,
  })
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/dashboard')
  return {}
}

export async function openDisputeAction(
  bookingId: string,
  reason: string,
  description: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.renterId !== session.user.id && booking.ownerId !== session.user.id) {
    return { error: 'You are not a party to this booking.' }
  }
  if (!['in_progress', 'completed', 'confirmed'].includes(booking.status)) {
    return { error: `Cannot dispute a booking in status ${booking.status}.` }
  }
  const existing = await db.dispute.findUnique({ where: { bookingId } })
  if (existing) return { error: 'A dispute already exists for this booking.' }
  await db.dispute.create({
    data: {
      bookingId,
      openedBy: session.user.id,
      reason,
      description,
      status: 'open',
    },
  })
  await db.booking.update({ where: { id: bookingId }, data: { status: 'disputed' } })
  await logActivity(session.user.id, 'dispute_open', 'booking', bookingId, { reason })
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath('/owner/disputes')
  revalidatePath('/admin/disputes')
  return {}
}

export async function resolveDisputeAction(
  disputeId: string,
  resolutionNotes: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('admin')) return { error: 'Only admins can resolve disputes.' }
  const dispute = await db.dispute.findUnique({ where: { id: disputeId } })
  if (!dispute) return { error: 'Dispute not found.' }
  if (dispute.status === 'resolved') return { error: 'Dispute is already resolved.' }
  await db.dispute.update({
    where: { id: disputeId },
    data: {
      status: 'resolved',
      resolutionNotes,
      resolvedById: session.user.id,
      resolvedAt: new Date(),
    },
  })
  await db.booking.update({
    where: { id: dispute.bookingId },
    data: { status: 'resolved' },
  })
  await logActivity(session.user.id, 'dispute_resolve', 'dispute', disputeId, { notes: resolutionNotes })
  revalidatePath(`/admin/disputes/${disputeId}`)
  revalidatePath('/admin/disputes')
  return {}
}

export async function submitReviewAction(
  bookingId: string,
  rating: number,
  comment: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  if (rating < 1 || rating > 5) return { error: 'Rating must be between 1 and 5.' }
  if (!comment.trim()) return { error: 'Please write a short review.' }
  const booking = await db.booking.findUnique({ where: { id: bookingId } })
  if (!booking) return { error: 'Booking not found.' }
  if (booking.renterId !== session.user.id) {
    return { error: 'Only the renter of this booking can review it.' }
  }
  if (!['completed', 'reviewed'].includes(booking.status)) {
    return { error: `Cannot review a booking in status ${booking.status}.` }
  }
  const existing = await db.review.findUnique({ where: { bookingId } })
  if (existing) return { error: 'You have already reviewed this booking.' }
  await db.review.create({
    data: {
      bookingId,
      carId: booking.carId,
      renterId: session.user.id,
      ownerId: booking.ownerId,
      rating,
      comment: comment.trim(),
    },
  })
  await db.booking.update({ where: { id: bookingId }, data: { status: 'reviewed' } })
  await logActivity(session.user.id, 'review_create', 'review', bookingId, { rating })
  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath(`/cars/${booking.carId}`)
  return {}
}

export async function replyToReviewAction(
  reviewId: string,
  reply: string,
): Promise<{ error?: string }> {
  const session = await getCurrentSession()
  if (!session?.user?.id) return { error: 'Not signed in.' }
  const roles = (session.user as any).roles as string[]
  if (!roles.includes('owner')) return { error: 'Only owners can reply to reviews.' }
  const review = await db.review.findUnique({ where: { id: reviewId } })
  if (!review) return { error: 'Review not found.' }
  if (review.ownerId !== session.user.id) return { error: 'Not your review to reply to.' }
  if (review.ownerReply) return { error: 'You have already replied to this review.' }
  if (!reply.trim()) return { error: 'Reply cannot be empty.' }
  await db.review.update({
    where: { id: reviewId },
    data: { ownerReply: reply.trim(), repliedAt: new Date() },
  })
  await logActivity(session.user.id, 'review_reply', 'review', reviewId, {})
  revalidatePath(`/owner/reviews`)
  revalidatePath(`/cars/${review.carId}`)
  return {}
}

function eachDay(start: Date, end: Date): Date[] {
  const out: Date[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    out.push(new Date(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return out
}