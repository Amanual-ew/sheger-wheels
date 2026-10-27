'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

const DEBOUNCE_MS = 350

export function SearchBar({ initial }: { initial: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initial)
  // The last q value this component pushed to (or read from) the URL
  const lastSynced = useRef(initial)

  // 1) Typing -> update the URL after a short pause
  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed === (searchParams.get('q') ?? '')) return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (trimmed) params.set('q', trimmed)
      else params.delete('q')
      params.delete('page') // back to page 1 on a new search
      lastSynced.current = trimmed
      router.replace(`/cars?${params.toString()}`, { scroll: false })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [value, searchParams, router])

  // 2) URL changed from outside (e.g. "Reset filters") -> update the box
  useEffect(() => {
    const q = searchParams.get('q') ?? ''
    if (q !== lastSynced.current) {
      lastSynced.current = q
      setValue(q)
    }
  }, [searchParams])

  return (
    <form
      role="search"
      className="relative flex-1"
      onSubmit={(e) => e.preventDefault()}
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search by make or model"
        aria-label="Search cars"
        className="h-9 pl-9 pr-9"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  )
}