'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { CarFront, X } from 'lucide-react'

type Filters = {
  q?: string
  neighbourhood?: string
  minPrice?: string
  maxPrice?: string
  transmission?: string
  minSeats?: string
  sort?: string
}

export function CarCatalogueFilters({
  neighbourhoods,
  current,
}: {
  neighbourhoods: string[]
  current: Filters
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // The URL is the single source of truth: build the next URL from the
  // current one, so search, sort and filters never overwrite each other.
  function update(patch: Partial<Filters>) {
    const next: Record<string, string | undefined> = { ...current, ...patch }
    const params = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => {
      if (k === 'page') return // go back to page 1 when a filter changes
      if (v) params.set(k, String(v))
    })
    startTransition(() => router.push(`/cars?${params.toString()}`))
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="neighbourhood" className="text-xs">Neighbourhood</Label>
        <Select
          value={current.neighbourhood ?? 'all'}
          onValueChange={(v) => update({ neighbourhood: v === 'all' ? undefined : v })}
        >
          <SelectTrigger id="neighbourhood" className="h-9 mt-1 w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any neighbourhood</SelectItem>
            {neighbourhoods.map((n) => (
              <SelectItem key={n} value={n}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor="minPrice" className="text-xs">Min ETB</Label>
          <Input
            key={`min-${current.minPrice ?? ''}`}
            id="minPrice"
            type="number"
            inputMode="numeric"
            defaultValue={current.minPrice ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (current.minPrice ?? '')) {
                update({ minPrice: e.target.value })
              }
            }}
            placeholder="0"
            className="h-9 mt-1"
          />
        </div>
        <div>
          <Label htmlFor="maxPrice" className="text-xs">Max ETB</Label>
          <Input
            key={`max-${current.maxPrice ?? ''}`}
            id="maxPrice"
            type="number"
            inputMode="numeric"
            defaultValue={current.maxPrice ?? ''}
            onBlur={(e) => {
              if (e.target.value !== (current.maxPrice ?? '')) {
                update({ maxPrice: e.target.value })
              }
            }}
            placeholder="10000"
            className="h-9 mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="transmission" className="text-xs">Transmission</Label>
        <Select
          value={current.transmission ?? 'all'}
          onValueChange={(v) => update({ transmission: v === 'all' ? undefined : v })}
        >
          <SelectTrigger id="transmission" className="h-9 mt-1 w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any transmission</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="minSeats" className="text-xs">Min seats</Label>
        <Select
          value={current.minSeats ?? 'all'}
          onValueChange={(v) => update({ minSeats: v === 'all' ? undefined : v })}
        >
          <SelectTrigger id="minSeats" className="h-9 mt-1 w-full">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="2">2+</SelectItem>
            <SelectItem value="4">4+</SelectItem>
            <SelectItem value="5">5+</SelectItem>
            <SelectItem value="7">7+</SelectItem>
            <SelectItem value="12">12+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs"
        onClick={() => router.push('/cars')}
      >
        <X className="h-3 w-3 mr-1" /> Reset filters
      </Button>
      {pending && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <CarFront className="h-3 w-3 animate-pulse" /> Updating...
        </p>
      )}
    </div>
  )
}