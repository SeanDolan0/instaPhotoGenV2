import { useEffect } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import type { AppSettings, MetadataFieldConfig } from '../types'

// Module-level refs shared across hook instances (MetadataTextSync + MetadataPanel)
const editedLeft = { current: false }
const editedRight = { current: false }

function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}

function resolveLocationText(
  location: AppSettings['location'],
  imageId: string | undefined,
): string {
  const raw = imageId && location.perPhoto[imageId]
    ? location.perPhoto[imageId]
    : location.text
  if (!raw && location.lat === null) return ''
  switch (location.format) {
    case 'name': return raw
    case 'coordinates': return location.lat !== null ? formatCoords(location.lat, location.lng!) : ''
    case 'both': {
      const coords = location.lat !== null ? formatCoords(location.lat, location.lng!) : ''
      return [raw, coords].filter(Boolean).join('\n')
    }
  }
}

function composeText(
  fields: MetadataFieldConfig[],
  side: 'left' | 'right',
  metadata: Record<string, string>,
): string {
  const lines: string[] = []
  const currentLine: string[] = []

  for (const field of fields) {
    if (field.key.startsWith('__linebreak__')) {
      if (currentLine.length) {
        lines.push(currentLine.join(' '))
        currentLine.length = 0
      }
      continue
    }
    if (!field.enabled || field.side !== side) continue
    if (field.key.startsWith('__custom:')) {
      if (field.label) currentLine.push(field.label)
      continue
    }
    const val = metadata[field.key]
    if (val) currentLine.push(val)
  }
  if (currentLine.length) lines.push(currentLine.join(' '))

  return lines.join('\n')
}

export function useMetadataText() {
  const { settings, settingsDispatch, images, selectedImageIdx } = useSettings()

  const meta = (images[selectedImageIdx]?.metadata ?? {}) as Record<string, string>
  const composedLeft = composeText(settings.metadataFields, 'left', meta)
  const composedRight = composeText(settings.metadataFields, 'right', meta)

  const imageId = images[selectedImageIdx]?.id
  const locationText = resolveLocationText(settings.location, imageId)
  const locationSide = settings.location.side

  useEffect(() => {
    if (!editedLeft.current) {
      const base = composedLeft
      const withLocation = locationSide === 'left' && locationText
        ? [base, locationText].filter(Boolean).join('\n')
        : base
      settingsDispatch({ type: 'SET_METADATA_TEXT', payload: withLocation })
    }
    if (!editedRight.current) {
      const base = composedRight
      const withLocation = locationSide === 'right' && locationText
        ? [base, locationText].filter(Boolean).join('\n')
        : base
      settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: withLocation })
    }
  }, [composedLeft, composedRight, locationText, locationSide])

  return { editedLeft, editedRight, composedLeft, composedRight }
}
