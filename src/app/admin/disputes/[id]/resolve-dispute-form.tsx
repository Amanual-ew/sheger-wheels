'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { resolveDisputeAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Loader2, Gavel } from 'lucide-react'

export function ResolveDisputeForm({ disputeId }: { disputeId: string }) {
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!notes.trim()) {
      toast.error('Please record resolution notes')
      return
    }
    startTransition(async () => {
      const res = await resolveDisputeAction(disputeId, notes)
      if (res.error) { toast.error(res.error); return }
      toast.success('Dispute resolved')
      router.push('/admin/disputes')
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Gavel className="h-4 w-4" /> Record resolution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="notes">Resolution notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Owner provided pre-trip photos showing the existing scratch. Refund partial payment of 1500 ETB to renter."
            rows={5}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground mt-1">{notes.length}/500</p>
        </div>
        <Button onClick={submit} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Gavel className="h-4 w-4 mr-1" />}
          Resolve dispute
        </Button>
      </CardContent>
    </Card>
  )
}
