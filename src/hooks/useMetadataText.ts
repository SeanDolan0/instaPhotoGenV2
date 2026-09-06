import { useEffect, useRef } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import type { AppSettings, ImageEntry, MetadataFieldConfig } from '../types'

// Per-image manual edits: imageId -> { left?: string; right?: string }
const manualEdits: Record<string, { left?: string; right?: string }> = {}

export function setManualEdit(imageId: string, side: 'left' | 'right', text: string) {
  if (!manualEdits[imageId]) manualEdits[imageId] = {}
  manualEdits[imageId][side] = text
}

export function clearManualEdit(imageId: string, side?: 'left' | 'right') {
  if (!manualEdits[imageId]) return
  if (!side) {
    delete manualEdits[imageId]
  } else {
    delete manualEdits[imageId][side]
  }
}

export function isImageEdited(imageId: string, side: 'left' | 'right'): boolean {
  return Boolean(manualEdits[imageId] && typeof manualEdits[imageId][side] === 'string')
}

export function getManualEdit(imageId: string, side: 'left' | 'right'): string | undefined {
  return manualEdits[imageId]?.[side]
}

// Module-level refs for backward compatibility
export const editedLeft = {
  get current() { return false },
  set current(_: boolean) { /* no-op */ },
}
export const editedRight = {
  get current() { return false },
  set current(_: boolean) { /* no-op */ },
}

export function formatCoords(lat: number, lng: number): string {
  const numLat = typeof lat === 'number' ? lat : parseFloat(lat)
  const numLng = typeof lng === 'number' ? lng : parseFloat(lng)
  if (isNaN(numLat) || isNaN(numLng)) return ''
  const latDir = numLat >= 0 ? 'N' : 'S'
  const lngDir = numLng >= 0 ? 'E' : 'W'
  return `${Math.abs(numLat).toFixed(4)}° ${latDir}, ${Math.abs(numLng).toFixed(4)}° ${lngDir}`
}

export function resolveLocationText(
  location: AppSettings['location'],
  imageId: string | undefined,
  fallbackGps?: { lat: number; lng: number },
): string {
  const raw = imageId && location.perPhoto[imageId]
    ? location.perPhoto[imageId]
    : location.text

  const effectiveLat = location.lat !== null ? location.lat : (fallbackGps?.lat ?? null)
  const effectiveLng = location.lng !== null ? location.lng : (fallbackGps?.lng ?? null)

  if (!raw && effectiveLat === null) return ''
  switch (location.format) {
    case 'name': return raw
    case 'coordinates': return effectiveLat !== null ? formatCoords(effectiveLat, effectiveLng!) : ''
    case 'both': {
      const coords = effectiveLat !== null ? formatCoords(effectiveLat, effectiveLng!) : ''
      return [raw, coords].filter(Boolean).join('\n')
    }
  }
}

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDateTime(
  rawDate: string | undefined,
  config?: AppSettings['dateTime'],
): string {
  if (!rawDate) return ''
  const str = rawDate.trim()
  // Match standard EXIF format: YYYY:MM:DD HH:MM[:SS] or ISO YYYY-MM-DD HH:MM
  const match = str.match(/^(\d{4})[:\-](\d{2})[:\-](\d{2})(?:[T\s]+(\d{2}):(\d{2})(?::(\d{2}))?)?/)
  if (!match) return str

  const [, yStr, mStr, dStr, hourStr, minStr] = match
  const y = parseInt(yStr, 10)
  const m = parseInt(mStr, 10)
  const d = parseInt(dStr, 10)
  const hour = hourStr !== undefined ? parseInt(hourStr, 10) : null
  const min = minStr !== undefined ? parseInt(minStr, 10) : null

  const dateFormat = config?.dateFormat ?? 'YYYY-MM-DD'
  const timeFormat = config?.timeFormat ?? '24h'
  const separator = config?.separator ?? ' '

  let datePart = ''
  switch (dateFormat) {
    case 'YYYY-MM-DD':
      datePart = `${yStr}-${mStr}-${dStr}`
      break
    case 'MM/DD/YYYY':
      datePart = `${mStr}/${dStr}/${yStr}`
      break
    case 'DD/MM/YYYY':
      datePart = `${dStr}/${mStr}/${yStr}`
      break
    case 'MMM D, YYYY':
      datePart = `${MONTH_NAMES_SHORT[m - 1] || mStr} ${d}, ${y}`
      break
    case 'D MMM YYYY':
      datePart = `${d} ${MONTH_NAMES_SHORT[m - 1] || mStr} ${y}`
      break
    case 'none':
      datePart = ''
      break
  }

  let timePart = ''
  if (hour !== null && min !== null && timeFormat !== 'none') {
    const minPadded = min.toString().padStart(2, '0')
    if (timeFormat === '24h') {
      const hourPadded = hour.toString().padStart(2, '0')
      timePart = `${hourPadded}:${minPadded}`
    } else if (timeFormat === '12h') {
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const h12 = hour % 12 || 12
      timePart = `${h12}:${minPadded} ${ampm}`
    } else if (timeFormat === '12h-no-am') {
      const h12 = hour % 12 || 12
      timePart = `${h12}:${minPadded}`
    }
  }

  if (datePart && timePart) {
    return `${datePart}${separator}${timePart}`
  }
  return datePart || timePart || str
}

export function composeText(
  fields: MetadataFieldConfig[],
  side: 'left' | 'right',
  metadata: Record<string, string>,
  locationText = '',
  dateTimeConfig?: AppSettings['dateTime'],
  rawDate?: string,
): string {
  const lines: string[] = []
  const currentLine: string[] = []

  for (const field of fields) {
    if (!field.enabled || field.side !== side) continue

    if (field.key.startsWith('__linebreak')) {
      if (currentLine.length) {
        lines.push(currentLine.join(' '))
        currentLine.length = 0
      } else {
        lines.push('')
      }
      continue
    }

    if (field.key === 'location') {
      if (locationText) {
        currentLine.push(locationText)
      }
      continue
    }

    if (field.key === 'date') {
      const formatted = formatDateTime(rawDate || metadata.rawDate || metadata.date, dateTimeConfig)
      if (formatted) {
        currentLine.push(formatted)
      }
      continue
    }

    if (field.key.startsWith('__custom:')) {
      if (field.label) currentLine.push(field.label)
      continue
    }

    const val = metadata[field.key]
    if (val) currentLine.push(val)
  }

  if (currentLine.length) lines.push(currentLine.join(' '))

  return lines.flatMap(l => l.split('\n')).join('\n')
}

export function resolveMetadataTextForImage(
  image: ImageEntry,
  settings: AppSettings,
): { leftText: string; rightText: string } {
  const meta = (image.metadata ?? {}) as Record<string, string>
  const locationText = resolveLocationText(settings.location, image.id, image.metadata?.gps)
  const rawDate = image.metadata?.rawDate

  const leftEdit = getManualEdit(image.id, 'left')
  const rightEdit = getManualEdit(image.id, 'right')

  const leftText = leftEdit !== undefined
    ? leftEdit
    : composeText(settings.metadataFields, 'left', meta, locationText, settings.dateTime, rawDate)

  const rightText = rightEdit !== undefined
    ? rightEdit
    : composeText(settings.metadataFields, 'right', meta, locationText, settings.dateTime, rawDate)

  return { leftText, rightText }
}

export function useMetadataText() {
  const { settings, settingsDispatch, images, selectedImageIdx } = useSettings()
  const activeImage = images[selectedImageIdx]
  const imageId = activeImage?.id

  const meta = (activeImage?.metadata ?? {}) as Record<string, string>
  const locationText = resolveLocationText(settings.location, imageId, activeImage?.metadata?.gps)
  const rawDate = activeImage?.metadata?.rawDate

  const composedLeft = composeText(settings.metadataFields, 'left', meta, locationText, settings.dateTime, rawDate)
  const composedRight = composeText(settings.metadataFields, 'right', meta, locationText, settings.dateTime, rawDate)

  const lastImageIdRef = useRef<string | undefined>(imageId)

  useEffect(() => {
    if (!imageId) return

    const isDifferentImage = lastImageIdRef.current !== imageId
    lastImageIdRef.current = imageId

    const leftEdit = getManualEdit(imageId, 'left')
    const rightEdit = getManualEdit(imageId, 'right')

    const newLeft = leftEdit !== undefined ? leftEdit : composedLeft
    const newRight = rightEdit !== undefined ? rightEdit : composedRight

    if (isDifferentImage || settings.metadataText !== newLeft) {
      settingsDispatch({ type: 'SET_METADATA_TEXT', payload: newLeft })
    }
    if (isDifferentImage || settings.metadataTextRight !== newRight) {
      settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: newRight })
    }
  }, [imageId, composedLeft, composedRight, settings.metadataFields, settings.location, settings.dateTime])

  return {
    composedLeft,
    composedRight,
    isLeftEdited: imageId ? isImageEdited(imageId, 'left') : false,
    isRightEdited: imageId ? isImageEdited(imageId, 'right') : false,
    resetLeft: () => {
      if (imageId) {
        clearManualEdit(imageId, 'left')
        settingsDispatch({ type: 'SET_METADATA_TEXT', payload: composedLeft })
      }
    },
    resetRight: () => {
      if (imageId) {
        clearManualEdit(imageId, 'right')
        settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: composedRight })
      }
    },
  }
}
