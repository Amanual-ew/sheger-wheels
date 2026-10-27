'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toggleAnnouncementAction, deleteAnnouncementAction } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { Loader2, Power, Trash2 } from 'lucide-react'

export function AnnouncementActions({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function toggle() {
    startTransition(async () => {
      const res = await toggleAnnouncementAction(id, !active)
      if (res.error) { toast.error(res.error); return }
      toast.success(active ? 'Announcement hidden' : 'Announcement shown')
      router.refresh()
    })
  }

  function remove() {
    if (!confirm('Delete this announcement? This cannot be undone.')) return
    startTransition(async () => {
      const res = await deleteAnnouncementAction(id)
      if (res.error) { toast.error(res.error); return }
      toast.success('Announcement deleted')
      router.refresh()
    })
  }

  return (
    <div className="flex gap-1 shrink-0">
      <Button size="sm" variant="outline" disabled={pending} onClick={toggle} title={active ? 'Hide' : 'Show'}>
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Power className="h-3 w-3" />}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={remove} title="Delete">
        <Trash2 className="h-3 w-3 text-rose-600" />
      </Button>
    </div>
  )
}
