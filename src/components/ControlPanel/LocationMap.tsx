import { useEffect, useRef } from 'react'
import L from 'leaflet'
import styles from '../../styles/ControlPanel.module.css'

// Fix default marker icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LocationMapProps {
  lat: number | null
  lng: number | null
  onPick: (lat: number, lng: number, name: string) => void
}

export default function LocationMap({ lat, lng, onPick }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const center: L.LatLngTuple = lat !== null && lng !== null ? [lat, lng] : [20, 0]
    const zoom = lat !== null ? 10 : 2

    const map = L.map(containerRef.current, {
      center,
      zoom,
      zoomControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    // Place initial marker if coords exist
    if (lat !== null && lng !== null) {
      markerRef.current = L.marker([lat, lng], { draggable: true }).addTo(map)
      markerRef.current.on('dragend', () => {
        const pos = markerRef.current?.getLatLng()
        if (pos) reverseGeocode(pos.lat, pos.lng)
      })
    }

    // Click to place/move pin
    map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat: clickLat, lng: clickLng } = e.latlng
      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng)
      } else {
        markerRef.current = L.marker(e.latlng, { draggable: true }).addTo(map)
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current?.getLatLng()
          if (pos) reverseGeocode(pos.lat, pos.lng)
        })
      }
      reverseGeocode(clickLat, clickLng)
    })

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function reverseGeocode(rLat: number, rLng: number) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${rLat}&lon=${rLng}`,
          { headers: { 'Accept-Language': 'en' } },
        )
        const data = await res.json()
        const name = data.display_name?.split(',').slice(0, 3).join(',') ?? ''
        onPick(rLat, rLng, name)
      } catch {
        onPick(rLat, rLng, '')
      }
    }, 500)
  }

  return <div ref={containerRef} className={styles.locationMap} />
}
