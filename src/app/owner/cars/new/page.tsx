import { requireRole } from '@/lib/session'
import { OwnerNav } from '@/components/owner-nav'
import { CarForm } from './car-form'

export const dynamic = 'force-dynamic'

export const metadata = { title: 'List a new car' }

export default async function NewCarPage() {
  await requireRole('owner')
  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">List a new car</h1>
        <p className="text-sm text-muted-foreground">
          New listings start as <code>pending</code> until an admin approves them.
        </p>
      </header>
      <OwnerNav />
      <CarForm mode="create" />
    </div>
  )
}
