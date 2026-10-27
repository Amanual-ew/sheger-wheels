'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { publishAnnouncementAction } from '@/lib/actions/admin'
import { toast } from 'sonner'
import { Loader2, Megaphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AnnouncementForm() {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(true)
  const router = useRouter()

  function submit() {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    startTransition(async () => {
      const res = await publishAnnouncementAction(title, message, active)
      if (res.error) { toast.error(res.error); return }
      toast.success('Announcement published')
      setTitle('')
      setMessage('')
      setActive(true)
      router.refresh()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4" /> New announcement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Holiday weekend: 15% off SUVs"
            maxLength={80}
          />
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share details with your users..."
            rows={3}
            maxLength={300}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch id="active" checked={active} onCheckedChange={setActive} />
          <Label htmlFor="active">Active (visible to users)</Label>
        </div>
        <Button onClick={submit} disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Megaphone className="h-4 w-4 mr-1" />}
          Publish
        </Button>
      </CardContent>
    </Card>
  )
}
