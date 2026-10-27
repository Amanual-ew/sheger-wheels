'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitReviewAction } from '@/lib/actions/bookings'
import { toast } from 'sonner'
import { Loader2, Star } from 'lucide-react'

export function ReviewForm({ bookingId, carName }: { bookingId: string; carName: string }) {
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!comment.trim()) {
      toast.error('Please write a short review')
      return
    }
    startTransition(async () => {
      const res = await submitReviewAction(bookingId, rating, comment)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Review submitted!')
      router.push(`/bookings/${bookingId}`)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">How was your trip in the {carName}?</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label>Rating</Label>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1"
                  aria-label={`${n} star${n === 1 ? '' : 's'}`}
                >
                  <Star
                    className={`h-7 w-7 ${
                      n <= rating
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="comment">Comment</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other renters about your trip. Was the car clean? Was the owner responsive?"
              rows={5}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground mt-1">{comment.length}/500</p>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Submitting...</>
            ) : (
              <>Submit review</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
