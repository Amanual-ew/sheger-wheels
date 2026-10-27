import Link from 'next/link'
import type { Metadata } from 'next'
import { requireRole } from '@/lib/session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus } from 'lucide-react'
import { NewUserForm } from './new-user-form'

export const metadata: Metadata = { title: 'Add user' }
export const dynamic = 'force-dynamic'

export default async function AdminNewUserPage() {
  await requireRole('admin')

  return (
    <div className="px-4 py-8 md:px-8">
      <nav className="mb-3 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/admin" className="hover:text-primary">Admin</Link>
        <span className="mx-1">/</span>
        <Link href="/admin/users" className="hover:text-primary">Users</Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">Add user</span>
      </nav>

      <header className="mb-6">
        <h1 className="text-2xl font-bold">Add user</h1>
        <p className="text-sm text-muted-foreground">
          Register a new owner or renter account. They can sign in straight away.
        </p>
      </header>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Account details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NewUserForm />
        </CardContent>
      </Card>
    </div>
  )
}