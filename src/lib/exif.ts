import type { ImageEntry, NormalizedMetadata } from '../types'
import ExifReader from 'exifreader'

export async function extractMetadata(file: File): Promise<Partial<NormalizedMetadata>> {
  try {
    // ExifReader can read File/Blob directly without loading full ArrayBuffer into JS memory
    let tags: any
    try {
      tags = await ExifReader.load(file)
    } catch {
      const buffer = await file.arrayBuffer()
      tags = ExifReader.load(buffer)
    }

    const get = (name: string) => {
      const tag = (tags as Record<string, { description?: string }>)[name]
      return String(tag?.description ?? '')
    }

    const lat = parseGpsCoordinate((tags as any)?.GPSLatitude, (tags as any)?.GPSLatitudeRef)
    const lng = parseGpsCoordinate((tags as any)?.GPSLongitude, (tags as any)?.GPSLongitudeRef)
    const gps = lat !== null && lng !== null ? { lat, lng } : undefined

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
      date: normalizeDate(get('DateTimeOriginal') || get('CreateDate') || get('ModifyDate')),
      rawDate: get('DateTimeOriginal') || get('CreateDate') || get('ModifyDate') || undefined,
      gps,
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

export function generateThumbnail(img: HTMLImageElement, maxDim = 160): string {
  try {
    const canvas = document.createElement('canvas')
    const scale = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1)
    const w = Math.max(1, Math.round(img.naturalWidth * scale))
    const h = Math.max(1, Math.round(img.naturalHeight * scale))
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(img, 0, 0, w, h)
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    canvas.width = 0
    canvas.height = 0
    return dataUrl
  } catch {
    return ''
  }
}

export async function processImageFiles(
  fileList: FileList | File[],
  onChunkLoaded?: (entries: ImageEntry[]) => void,
  onProgress?: (current: number, total: number) => void,
  concurrency = 3,
): Promise<ImageEntry[]> {
  const files = Array.from(fileList).filter(
    f => f.type.startsWith('image/') || /\.(jpe?g|png|webp|avif|tiff?)$/i.test(f.name),
  )
  if (!files.length) return []

  const allEntries: ImageEntry[] = []
  let processed = 0
  onProgress?.(0, files.length)

  for (let i = 0; i < files.length; i += concurrency) {
    const chunk = files.slice(i, i + concurrency)
    const chunkResults = await Promise.all(
      chunk.map(async file => {
        try {
          const [img, metadata] = await Promise.all([loadImage(file), extractMetadata(file)])
          const thumbnailUrl = generateThumbnail(img)
          return {
            id: crypto.randomUUID(),
            file,
            img,
            metadata,
            carouselSlides: 0,
            thumbnailUrl,
          } as ImageEntry
        } catch {
          return null
        }
      }),
    )
    const valid = chunkResults.filter(Boolean) as ImageEntry[]
    if (valid.length) {
      allEntries.push(...valid)
      onChunkLoaded?.(valid)
    }
    processed += chunk.length
    onProgress?.(Math.min(processed, files.length), files.length)
    // Yield to the browser to ensure the event loop remains responsive
    await new Promise(r => setTimeout(r, 0))
  }

  return allEntries
}

function parseGpsCoordinate(tag: any, refTag: any): number | null {
  if (!tag) return null
  let decimal: number | null = null
  if (typeof tag.description === 'number') {
    decimal = tag.description
  } else if (typeof tag.description === 'string' && !isNaN(Number(tag.description))) {
    decimal = Number(tag.description)
  } else if (Array.isArray(tag.value) && tag.value.length >= 3) {
    const deg = typeof tag.value[0] === 'number' ? tag.value[0] : (Array.isArray(tag.value[0]) ? tag.value[0][0] / tag.value[0][1] : 0)
    const min = typeof tag.value[1] === 'number' ? tag.value[1] : (Array.isArray(tag.value[1]) ? tag.value[1][0] / tag.value[1][1] : 0)
    const sec = typeof tag.value[2] === 'number' ? tag.value[2] : (Array.isArray(tag.value[2]) ? tag.value[2][0] / tag.value[2][1] : 0)
    decimal = deg + min / 60 + sec / 3600
  }
  if (decimal === null || isNaN(decimal)) return null
  const ref = String(refTag?.description || refTag?.value?.[0] || '').toUpperCase()
  if (ref === 'S' || ref === 'W') {
    decimal = -Math.abs(decimal)
  }
  return decimal
}

function normalizeCamera(make: string, model: string): string {
  const cleanMake = make
    .replace(/corporation/gi, '')
    .replace(/co\.,?\s*ltd\.?/gi, '')
    .trim()
  const cleanModel = model.trim()
  if (!cleanMake) return cleanModel
  if (!cleanModel) return cleanMake
  if (cleanModel.toLowerCase().startsWith(cleanMake.toLowerCase())) {
    return cleanModel
  }
  return `${cleanMake} ${cleanModel}`
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
