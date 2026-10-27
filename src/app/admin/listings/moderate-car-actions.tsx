'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { moderateCarAction } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

export function ModerateCarActions({ carId, status }: { carId: string; status: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function moderate(newStatus: 'approved' | 'rejected') {
    startTransition(async () => {
      const res = await moderateCarAction(carId, newStatus)
      if (res.error) { toast.error(res.error); return }
      toast.success(`Car ${newStatus}`)
      router.refresh()
    })
  }

  return (
    <div className="inline-flex gap-1">
      {status !== 'approved' && (
        <Button size="sm" variant="default" disabled={pending} onClick={() => moderate('approved')} title="Approve">
          {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
        </Button>
      )}
      {status !== 'rejected' && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => moderate('rejected')} title="Reject">
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  )
}
