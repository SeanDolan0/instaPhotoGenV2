import type { NormalizedMetadata } from '../types'
import ExifReader from 'exifreader'

export async function extractMetadata(file: File): Promise<Partial<NormalizedMetadata>> {
  try {
    const buffer = await file.arrayBuffer()
    const tags = ExifReader.load(buffer)

    const get = (name: string) => {
      const tag = (tags as Record<string, { description?: string }>)[name]
      return String(tag?.description ?? '')
    }

    return {
      camera: normalizeCamera(get('Make'), get('Model')),
      lens: normalizeLens(get('LensModel') || get('LensSpecification')),
      aperture: normalizeAperture(get('FNumber') || get('ApertureValue')),
      shutter: normalizeShutter(get('ExposureTime') || get('ShutterSpeedValue')),
      iso: normalizeIso(get('ISOSpeedRatings') || get('ISO')),
      focal: normalizeFocal(get('FocalLength')),
      focal35: normalizeFocal35(get('FocalLengthIn35mmFilm')),
      ev: normalizeEv(get('ExposureBiasValue')),
      wb: normalizeWB(get('WhiteBalance')),
      metering: normalizeMetering(get('MeteringMode')),
      flash: normalizeFlash(get('Flash')),
      date: normalizeDate(get('DateTimeOriginal')),
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

function normalizeCamera(make: string, model: string): string {
  return [make, model].filter(Boolean).join(' ').trim()
}

function normalizeLens(raw: string): string {
  return raw.trim()
}

function normalizeAperture(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/f\/?\s*/i, '').trim()
  return cleaned ? `f/${cleaned}` : ''
}

function normalizeShutter(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/\s*s(ec)?\.?/i, '').trim()
  return cleaned ? `${cleaned}s` : ''
}

function normalizeIso(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/iso/gi, '').trim()
  return cleaned ? `ISO ${cleaned}` : ''
}

function normalizeFocal(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/mm/gi, '').trim()
  return cleaned ? `${cleaned}mm` : ''
}

function normalizeFocal35(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/mm/gi, '').trim()
  return cleaned ? `${cleaned}mm (35mm)` : ''
}

function normalizeEv(raw: string): string {
  if (!raw) return ''
  const cleaned = raw.replace(/\s*ev\s*/i, '').trim()
  return cleaned ? `${cleaned} EV` : ''
}

function normalizeWB(raw: string): string {
  if (!raw) return ''
  return `WB ${raw.trim()}`
}

function normalizeMetering(raw: string): string {
  if (!raw) return ''
  return `Metering ${raw.trim()}`
}

function normalizeFlash(raw: string): string {
  if (!raw) return ''
  return `Flash ${raw.trim()}`
}

function normalizeDate(raw: string): string {
  if (!raw) return ''
  const match = raw.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}:\d{2})/)
  if (match) {
    const [, y, m, d, hm] = match
    return `${y}-${m}-${d} ${hm}`
  }
  return raw.trim()
}
