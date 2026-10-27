'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'

type Initial = {
  id?: string
  make?: string
  model?: string
  year?: number
  transmission?: string
  seats?: number
  fuel?: string
  neighbourhood?: string
  latitude?: number
  longitude?: number
  pricePerDay?: number
  photos?: string[]
  description?: string
  status?: string
}

const ADDIS_NEIGHBOURHOODS = [
  'Bole', 'Kazanchis', 'Piassa', 'Merkato', 'Cazanchis', 'Sarbet', 'Megenagna', '4 Kilo',
]

const NEIGH_COORDS: Record<string, { lat: number; lng: number }> = {
  Bole: { lat: 8.9999, lng: 38.7877 },
  Kazanchis: { lat: 9.0150, lng: 38.7940 },
  Piassa: { lat: 9.0360, lng: 38.7400 },
  Merkato: { lat: 9.0331, lng: 38.7423 },
  Cazanchis: { lat: 9.0160, lng: 38.7935 },
  Sarbet: { lat: 9.0200, lng: 38.7300 },
  Megenagna: { lat: 9.0097, lng: 38.7717 },
  '4 Kilo': { lat: 9.0340, lng: 38.7450 },
}

const DEFAULT_PHOTOS = [
  'https://images.unsplash.com/photo-1549399542-7c2f9d1f3c4a?w=800&q=80',
  'https://images.unsplash.com/photo-1503376788356-8eeb6b08f7c1?w=800&q=80',
]

export function CarForm({ mode, initial }: { mode: 'create' | 'edit'; initial?: Initial }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [make, setMake] = useState(initial?.make ?? '')
  const [model, setModel] = useState(initial?.model ?? '')
  const [year, setYear] = useState(initial?.year ? String(initial.year) : String(new Date().getFullYear()))
  const [transmission, setTransmission] = useState(initial?.transmission ?? 'automatic')
  const [seats, setSeats] = useState(initial?.seats ? String(initial.seats) : '5')
  const [fuel, setFuel] = useState(initial?.fuel ?? 'petrol')
  const [neighbourhood, setNeighbourhood] = useState(initial?.neighbourhood ?? 'Bole')
  const [pricePerDay, setPricePerDay] = useState(initial?.pricePerDay ? String(initial.pricePerDay) : '1500')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [photos, setPhotos] = useState((initial?.photos ?? DEFAULT_PHOTOS).join('\n'))
  const [status, setStatus] = useState(initial?.status ?? 'pending')
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!make.trim()) errs.make = 'Required'
    if (!model.trim()) errs.model = 'Required'
    const yearNum = Number(year)
    if (!year || yearNum < 1990 || yearNum > new Date().getFullYear() + 1) {
      errs.year = `Year must be 1990–${new Date().getFullYear() + 1}`
    }
    const seatsNum = Number(seats)
    if (!seats || seatsNum < 1 || seatsNum > 20) errs.seats = '1–20'
    const priceNum = Number(pricePerDay)
    if (!pricePerDay || priceNum < 100 || priceNum > 100000) {
      errs.pricePerDay = '100–100000 ETB'
    }
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const photoList = photos
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
    if (photoList.length === 0) {
      photoList.push(...DEFAULT_PHOTOS)
    }
    const coords = NEIGH_COORDS[neighbourhood] ?? NEIGH_COORDS.Bole
    const body = {
      make, model,
      year: yearNum,
      transmission, seats: seatsNum, fuel,
      neighbourhood,
      latitude: coords.lat,
      longitude: coords.lng,
      pricePerDay: priceNum,
      description,
      photos: photoList,
      status,
    }

    startTransition(async () => {
      if (mode === 'create') {
        const res = await fetch('/api/cars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to create car')
          return
        }
        toast.success('Car listed! Pending admin approval.')
        router.push('/owner/cars')
        router.refresh()
      } else if (initial?.id) {
        const res = await fetch(`/api/cars/${initial.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Failed to update car')
          return
        }
        toast.success('Car updated')
        router.push('/owner/cars')
        router.refresh()
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Car details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Make" error={errors.make}>
              <Input value={make} onChange={(e) => setMake(e.target.value)} placeholder="Toyota" />
            </Field>
            <Field label="Model" error={errors.model}>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Corolla" />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Year" error={errors.year}>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </Field>
            <Field label="Seats" error={errors.seats}>
              <Input type="number" value={seats} onChange={(e) => setSeats(e.target.value)} />
            </Field>
            <Field label="Price ETB/day" error={errors.pricePerDay}>
              <Input type="number" value={pricePerDay} onChange={(e) => setPricePerDay(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Transmission">
              <Select value={transmission} onValueChange={setTransmission}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fuel">
              <Select value={fuel} onValueChange={setFuel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <Field label="Neighbourhood">
            <Select value={neighbourhood} onValueChange={setNeighbourhood}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ADDIS_NEIGHBOURHOODS.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Coordinates are auto-filled from neighbourhood demo data.
            </p>
          </Field>
          <Field label="Description">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the car, condition, special features..."
              rows={4}
              maxLength={500}
            />
          </Field>
          <Field label="Photos (one URL per line)">
            <Textarea
              value={photos}
              onChange={(e) => setPhotos(e.target.value)}
              placeholder="https://..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Use Unsplash URLs. Default demo photos used if blank.
            </p>
          </Field>
          {mode === 'edit' && (
            <Field label="Status">
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Approved (visible)</SelectItem>
                  <SelectItem value="inactive">Inactive (hidden from public)</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                You can hide your car by setting it to inactive. Admin
                moderation flag remains separate.
              </p>
            </Field>
          )}
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Saving...</>
            ) : (
              <><Save className="h-4 w-4 mr-1" /> {mode === 'create' ? 'List car' : 'Save changes'}</>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  )
}
