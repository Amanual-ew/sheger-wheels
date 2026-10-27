'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

export function SortSelect({ value }: { value: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', next)
    params.delete('page') // go back to page 1 when the sort changes
    startTransition(() => router.push(`/cars?${params.toString()}`))
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Sort by</span>
      <Select value={value} onValueChange={onChange} disabled={pending}>
        <SelectTrigger className="h-8 w-[180px] text-xs" aria-label="Sort cars">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="newest">Newest first</SelectItem>
          <SelectItem value="price-asc">Price (low to high)</SelectItem>
          <SelectItem value="price-desc">Price (high to low)</SelectItem>
          <SelectItem value="popular">Most popular</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}