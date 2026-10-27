'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { replyToReviewAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Loader2, MessageSquare } from 'lucide-react'

export function ReviewReplyForm({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function submit() {
    if (!text.trim()) {
      toast.error('Reply cannot be empty')
      return
    }
    startTransition(async () => {
      const res = await replyToReviewAction(reviewId, text)
      if (res.error) { toast.error(res.error); return }
      toast.success('Reply posted')
      setOpen(false)
      setText('')
      router.refresh()
    })
  }

  if (!open) {
    return (
      <div className="mt-3">
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <MessageSquare className="h-4 w-4 mr-1" /> Reply
        </Button>
      </div>
    )
  }
  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Thank your renter or address the feedback..."
        rows={3}
        maxLength={300}
      />
      <div className="flex gap-2">
        <Button size="sm" disabled={pending} onClick={submit}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
          Post reply
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </div>
  )
}
