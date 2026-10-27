import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldX } from 'lucide-react'

export const metadata = { title: 'Forbidden' }

export default function ForbiddenPage() {
  return (
    <div className="container mx-auto max-w-md px-4 py-20 text-center">
      <ShieldX className="h-14 w-14 mx-auto mb-4 text-muted-foreground" />
      <h1 className="text-2xl font-bold mb-2">403 — Forbidden</h1>
      <p className="text-sm text-muted-foreground mb-6">
        You don't have permission to view this page. If you reached this page
        by mistake, return home and try a different account.
      </p>
      <div className="flex gap-2 justify-center">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signin">Sign in as a different user</Link>
        </Button>
      </div>
    </div>
  )
}
