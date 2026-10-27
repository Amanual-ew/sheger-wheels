'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw } from 'lucide-react'

/**
 * Simulated trip tracker. Uses Leaflet to show a marker that animates between
 * a few seeded sample points around the pickup location.
 *
 * Clearly labelled as a simulation in the parent page.
 */
const SAMPLE_OFFSETS = [
  { lat: 0.001, lng: 0.001 },
  { lat: 0.002, lng: -0.001 },
  { lat: 0.000, lng: -0.002 },
  { lat: -0.002, lng: 0.000 },
  { lat: -0.001, lng: 0.002 },
  { lat: 0.001, lng: 0.001 },
]

export function TrackClient({
  lat, lng, neighbourhood,
}: {
  lat: number
  lng: number
  neighbourhood: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [running, setRunning] = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [showMap, setShowMap] = useState(false)

  useEffect(() => {
    if (!showMap) return

    let cancelled = false
    async function load() {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')
        if (!containerRef.current || cancelled) return
        if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        }).setView([lat, lng], 15)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        }).addTo(map)
        const marker = L.marker([lat, lng]).addTo(map)
          .bindPopup('Pickup point (simulation)')
        mapRef.current = map
        markerRef.current = marker
      } catch (e) {
        console.error('Track map load failed', e)
      }
    }
    load()
    return () => {
      cancelled = true
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null }
    }
  }, [showMap, lat, lng, neighbourhood])

  function start() {
    if (!showMap) {
      setShowMap(true)
      return
    }
    if (running) return
    setRunning(true)
    intervalRef.current = setInterval(() => {
      setStepIdx((i) => {
        const next = (i + 1) % SAMPLE_OFFSETS.length
        const offset = SAMPLE_OFFSETS[next]
        markerRef.current?.setLatLng([lat + offset.lat, lng + offset.lng])
        return next
      })
    }, 2000)
  }

  function pause() {
    setRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  function reset() {
    pause()
    setStepIdx(0)
    markerRef.current?.setLatLng([lat, lng])
  }

  if (!showMap) {
    return (
      <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-center">
        <p className="text-sm font-medium text-foreground">Trip route preview</p>
        <p className="mt-1 text-xs text-muted-foreground">The interactive map loads only when you open the tracker.</p>
        <Button className="mt-4" size="sm" onClick={() => setShowMap(true)}>
          <Play className="mr-1 h-4 w-4" /> View trip map
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="h-72 w-full overflow-hidden rounded-lg border bg-muted"
        aria-label={`Simulation map for ${neighbourhood}`}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!running ? (
          <Button size="sm" onClick={start}>
            <Play className="mr-1 h-4 w-4" /> Start simulation
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={pause}>
            <Pause className="mr-1 h-4 w-4" /> Pause
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={reset}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reset
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {stepIdx + 1} / {SAMPLE_OFFSETS.length}
        </span>
      </div>
    </div>
  )
}
