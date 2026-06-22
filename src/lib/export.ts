import type { NormalizedMetadata } from '../types'

export function exportSingle(canvas: HTMLCanvasElement, filename?: string): void {
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename ?? `iphoto_${timestamp()}.png`
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

export async function exportBatch(
  items: { canvas: HTMLCanvasElement; metadata: Partial<NormalizedMetadata> }[],
): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  const blobs = await Promise.all(
    items.map((item) =>
      new Promise<{ name: string; blob: Blob }>((resolve) => {
        item.canvas.toBlob((blob) => {
          if (blob) {
            const date = item.metadata.date
              ? item.metadata.date.replace(/[:\s-]/g, '-')
              : timestamp()
            resolve({ name: `iphoto_${date}.png`, blob })
          }
        }, 'image/png')
      }),
    ),
  )

  for (const { name, blob } of blobs) {
    zip.file(name, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `instaphotogen_batch_${timestamp()}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

function timestamp(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`
}
