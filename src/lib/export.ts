import type { ExportConfig } from '../types'

type CanvasItem = { canvas: HTMLCanvasElement; filename?: string }

function getMimeAndExt(config: ExportConfig) {
  const mime = config.format === 'jpeg' ? 'image/jpeg' : 'image/png'
  const ext = config.format === 'jpeg' ? 'jpg' : 'png'
  return { mime, ext }
}

export function canvasToBlob(
  canvas: HTMLCanvasElement,
  config: ExportConfig,
): Promise<Blob | null> {
  const { mime } = getMimeAndExt(config)
  const quality = config.format === 'jpeg' ? config.jpegQuality / 100 : undefined
  return new Promise(resolve => canvas.toBlob(resolve, mime, quality))
}

export function exportSingle(
  canvas: HTMLCanvasElement,
  config: ExportConfig,
  filename?: string,
): void {
  const { mime, ext } = getMimeAndExt(config)
  const quality = config.format === 'jpeg' ? config.jpegQuality / 100 : undefined

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
      ? (filename.endsWith(`.${ext}`) ? filename : `${filename}.${ext}`)
      : `iphoto_${timestamp()}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, mime, quality)
}

export interface ZipExportEntry {
  filename: string
  getBlob: () => Promise<Blob | null>
}

export async function exportAllAsZip(
  entries: ZipExportEntry[],
  onProgress?: (current: number, total: number) => void,
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const total = entries.length
  onProgress?.(0, total)

  for (let i = 0; i < total; i++) {
    const entry = entries[i]
    try {
      const blob = await entry.getBlob()
      if (blob) {
        zip.file(entry.filename, blob)
      }
    } catch (e) {
      console.error(`Failed to export ${entry.filename}`, e)
    }
    onProgress?.(i + 1, total)
    // Yield to the browser to ensure the event loop stays responsive
    await new Promise(r => setTimeout(r, 0))
  }

  // Use compression: 'STORE' because JPEG/PNG are already compressed.
  // This makes zip generation instant and saves high CPU usage.
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE',
  })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `instaphotogen_batch_${timestamp()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportBatch(
  items: CanvasItem[],
  config: ExportConfig,
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const { mime, ext } = getMimeAndExt(config)
  const quality = config.format === 'jpeg' ? config.jpegQuality / 100 : undefined

  const blobs = await Promise.all(
    items.map((item) =>
      new Promise<{ name: string; blob: Blob } | null>((resolve) => {
        item.canvas.toBlob((blob) => {
          if (blob) {
            const name = item.filename ?? `iphoto_${timestamp()}.${ext}`
            resolve({ name, blob })
          } else {
            resolve(null)
          }
        }, mime, quality)
      }),
    ),
  )

  for (const item of blobs) {
    if (item) zip.file(item.name, item.blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `instaphotogen_batch_${timestamp()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

function timestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export function exportCarouselSlice(
  canvas: HTMLCanvasElement,
  config: ExportConfig,
  baseName: string,
  index: number,
  total: number,
): void {
  const { mime, ext } = getMimeAndExt(config)
  const quality = config.format === 'jpeg' ? config.jpegQuality / 100 : undefined

  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}_${index + 1}of${total}.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }, mime, quality)
}

export async function exportCarouselBatch(
  slices: HTMLCanvasElement[],
  config: ExportConfig,
  baseName: string,
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const { mime, ext } = getMimeAndExt(config)
  const quality = config.format === 'jpeg' ? config.jpegQuality / 100 : undefined

  const blobs = await Promise.all(
    slices.map((canvas, i) =>
      new Promise<{ name: string; blob: Blob } | null>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const name = `${baseName}_${i + 1}of${slices.length}.${ext}`
            resolve({ name, blob })
          } else {
            resolve(null)
          }
        }, mime, quality)
      }),
    ),
  )

  for (const item of blobs) {
    if (item) zip.file(item.name, item.blob)
  }

  slices.forEach(s => {
    s.width = 0
    s.height = 0
  })

  const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `iphoto_carousel_${baseName}_${timestamp()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}
