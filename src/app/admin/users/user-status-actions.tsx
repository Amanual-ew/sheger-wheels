'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { setUserStatusAction } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { Loader2, Ban, RotateCcw } from 'lucide-react'

export function UserStatusActions({ userId, status }: { userId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function change(newStatus: 'active' | 'suspended') {
    startTransition(async () => {
      const res = await setUserStatusAction(userId, newStatus)
      if (res.error) { toast.error(res.error); return }
      toast.success(`User ${newStatus === 'suspended' ? 'suspended' : 'reinstated'}`)
      router.refresh()
    })
  }

  return (
    <div className="inline-flex gap-1">
      {status !== 'suspended' ? (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => change('suspended')} title="Suspend">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
        </Button>
      ) : (
        <Button size="sm" variant="default" disabled={pending} onClick={() => change('active')} title="Reinstate">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
        </Button>
      )}
    </div>
  )
}
