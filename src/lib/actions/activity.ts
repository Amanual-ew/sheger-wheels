'use server'

import 'server-only'
import { db } from '@/lib/db'

/** Append to the audit log. Best-effort; failures are swallowed. */
export async function logActivity(
  userId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await db.activityLog.create({
      data: {
        userId,
        action,
        targetType: targetType ?? null,
        targetId: targetId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })
  } catch (e) {
    console.error('Failed to log activity', e)
  }
}
