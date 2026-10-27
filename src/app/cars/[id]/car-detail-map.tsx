'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'

/**
 * Approximate centre points for Addis Ababa neighbourhoods. The pin is placed
 * from the neighbourhood name so the map can never disagree with the label.
 * Add more neighbourhoods here as needed (lowercase keys).
 */
const NEIGHBOURHOOD_COORDS: Record<string, [number, number]> = {
  megenagna: [9.0200, 38.8010],
  piassa: [9.0358, 38.7513],
  piazza: [9.0358, 38.7513],
  kazanchis: [9.0170, 38.7690],
  cazanchis: [9.0170, 38.7690],
  bole: [8.9960, 38.7870],
  sarbet: [8.9937, 38.7336],
  cmc: [9.0210, 38.8420],
  gerji: [9.0030, 38.8370],
  mexico: [9.0100, 38.7430],
  'meskel square': [9.0107, 38.7612],
  lideta: [9.0090, 38.7330],
  'arat kilo': [9.0350, 38.7620],
  'sidist kilo': [9.0420, 38.7640],
  merkato: [9.0300, 38.7400],
  ayat: [9.0300, 38.8750],
  summit: [9.0000, 38.8500],
}

function resolveCoords(
  neighbourhood: string,
  lat: number,
  lng: number,
): [number, number] {
  return NEIGHBOURHOOD_COORDS[neighbourhood.trim().toLowerCase()] ?? [lat, lng]
}

/**
 * Browser-only Leaflet map. Loaded dynamically so the page can still render
 * on the server. Falls back to a static neighbourhood card if Leaflet is
 * unavailable (e.g. offline).
 */
export function CarDetailMap({
  lat,
  lng,
  neighbourhood,
}: {
  lat: number
  lng: number
  neighbourhood: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [error, setError] = useState(false)
  const [showMap, setShowMap] = useState(false)

  const [pinLat, pinLng] = resolveCoords(neighbourhood, lat, lng)

  useEffect(() => {
    if (!showMap) return

    let cancelled = false
    let leafletMap: any = null

    async function load() {
      try {
        const L = (await import('leaflet')).default
        await import('leaflet/dist/leaflet.css')
        if (!containerRef.current || cancelled) return
        if (mapRef.current) {
          mapRef.current.remove()
          mapRef.current = null
        }
        const map = L.map(containerRef.current, {
          scrollWheelZoom: false,
          attributionControl: true,
        }).setView([pinLat, pinLng], 14)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)
        // Custom car marker. Leaflet's default marker images break under
        // Next.js bundling, so we draw the icon ourselves (no image files).
        const carIcon = L.divIcon({
          className: '',
          iconSize: [44, 52],
          iconAnchor: [22, 52],
          popupAnchor: [0, -48],
          html: `
            <div style="position:relative;width:44px;height:52px;">
              <div style="width:44px;height:44px;border-radius:50%;background:#f97316;border:3px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 17h14M3 13l2-5a2 2 0 0 1 1.9-1.4h10.2A2 2 0 0 1 19 8l2 5v4h-2M3 13v4h2"/>
                  <circle cx="7.5" cy="17" r="1.8" fill="#fff"/>
                  <circle cx="16.5" cy="17" r="1.8" fill="#fff"/>
                </svg>
              </div>
              <div style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:10px solid #f97316;"></div>
            </div>`,
        })
        L.marker([pinLat, pinLng], { icon: carIcon })
          .addTo(map)
          .bindPopup(`${neighbourhood}, Addis Ababa`)
          .openPopup()
        leafletMap = map
        mapRef.current = map
      } catch (e) {
        console.error('Map load failed', e)
        setError(true)
      }
    }

    load()
    return () => {
      cancelled = true
      if (leafletMap) {
        leafletMap.remove()
      }
    }
  }, [showMap, pinLat, pinLng, neighbourhood])

  if (error) {
    return (
      <div className="flex h-32 w-full items-center justify-center rounded-lg border bg-muted text-sm text-muted-foreground">
        <MapPin className="mr-2 h-4 w-4" />
        {neighbourhood}, Addis Ababa (lat {pinLat.toFixed(4)}, lng {pinLng.toFixed(4)})
      </div>
    )
  }

  if (!showMap) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        <MapPin className="mb-2 h-5 w-5 text-primary" />
        <p className="font-medium text-foreground">{neighbourhood}, Addis Ababa</p>
        <p className="mt-1">{pinLat.toFixed(4)}, {pinLng.toFixed(4)}</p>
        <button
          type="button"
          onClick={() => setShowMap(true)}
          className="mt-4 rounded-md border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          Show map
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden rounded-lg border bg-muted"
        aria-label={`Map showing ${neighbourhood}, Addis Ababa`}
      />
      <noscript>
        <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {neighbourhood}, Addis Ababa (lat {pinLat.toFixed(4)}, lng {pinLng.toFixed(4)}).
          Enable JavaScript for an interactive map.
        </div>
      </noscript>
    </div>
  )
}