import type { NormalizedMetadata } from '../types'

export async function extractMetadata(file: File): Promise<Partial<NormalizedMetadata>> {
  try {
    const exifr = await import('exifr')
    const tags = await exifr.parse(file, [
      'Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime',
      'ISOSpeedRatings', 'FocalLength', 'FocalLengthIn35mm',
      'ExposureBiasValue', 'WhiteBalance', 'MeteringMode',
      'Flash', 'DateTimeOriginal',
    ])

    return {
      camera: normalizeCamera(tags?.Make, tags?.Model),
      lens: normalizeLens(tags?.LensModel),
      aperture: normalizeAperture(tags?.FNumber),
      shutter: normalizeShutter(tags?.ExposureTime),
      iso: normalizeIso(tags?.ISOSpeedRatings),
      focal: normalizeFocal(tags?.FocalLength),
      focal35: normalizeFocal35(tags?.FocalLengthIn35mm),
      ev: normalizeEv(tags?.ExposureBiasValue),
      wb: normalizeWB(tags?.WhiteBalance),
      metering: normalizeMetering(tags?.MeteringMode),
      flash: normalizeFlash(tags?.Flash),
      date: normalizeDate(tags?.DateTimeOriginal),
    }
  } catch {
    return {}
  }
}

export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { resolve(img); URL.revokeObjectURL(url) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')) }
    img.src = url
  })
}

function normalizeCamera(make: string | undefined, model: string | undefined): string {
  const parts = [make, model].filter(Boolean)
  return parts.join(' ').trim()
}

function normalizeLens(raw: string | undefined): string {
  return (raw ?? '').trim()
}

function normalizeAperture(raw: number | string | undefined): string {
  if (raw == null) return ''
  const cleaned = String(raw).replace(/f\/?\s*/i, '').trim()
  return cleaned ? `f/${cleaned}` : ''
}

function normalizeShutter(raw: number | string | undefined): string {
  if (raw == null) return ''
  // exifr returns ExposureTime as a decimal or fraction string like "1/125"
  const s = String(raw)
  return s.includes('/') ? `${s}s` : `${parseFloat(s).toFixed(1).replace(/\.0$/, '')}s`
}

function normalizeIso(raw: number | string | undefined): string {
  if (raw == null) return ''
  return `ISO ${raw}`
}

function normalizeFocal(raw: number | string | undefined): string {
  if (raw == null) return ''
  return `${raw}mm`
}

function normalizeFocal35(raw: number | string | undefined): string {
  if (raw == null) return ''
  return `${raw}mm (35mm)`
}

function normalizeEv(raw: number | string | undefined): string {
  if (raw == null) return ''
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw))
  return `${n > 0 ? '+' : ''}${n} EV`
}

function normalizeWB(raw: string | undefined): string {
  if (!raw) return ''
  return `WB ${raw.trim()}`
}

function normalizeMetering(raw: string | undefined): string {
  if (!raw) return ''
  return `Metering ${raw.trim()}`
}

function normalizeFlash(raw: string | undefined): string {
  if (!raw) return ''
  return `Flash ${raw.trim()}`
}

function normalizeDate(raw: string | undefined): string {
  if (!raw) return ''
  const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}:\d{2})/)
  if (match) {
    const [, y, m, d, hm] = match
    return `${y}-${m}-${d} ${hm}`
  }
  return raw.trim()
}
