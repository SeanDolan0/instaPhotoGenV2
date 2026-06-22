import type { AppSettings, NormalizedMetadata } from '../types'
import { getTargetDimensions } from './targets'

export function renderCanvas(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  metadata: Partial<NormalizedMetadata>,
  settings: AppSettings,
  theme: 'light' | 'dark',
): HTMLCanvasElement {
  const { width, height } = getTargetDimensions(target)
  const dpr = window.devicePixelRatio || 1

  const canvas = document.createElement('canvas')
  canvas.width = width * dpr
  canvas.height = height * dpr
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)

  // Background
  ctx.fillStyle = theme === 'dark' ? '#1a1a1e' : '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Place image — fit within bounds, preserve aspect ratio, center
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight
  const scale = Math.min(width / imgW, height / imgH)
  const drawW = imgW * scale
  const drawH = imgH * scale
  const dx = (width - drawW) / 2
  const dy = (height - drawH) / 2

  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Metadata text
  const lines: string[] = []
  const currentLine: string[] = []
  const fields = settings.metadataFields
  const vals = metadata as Record<string, string>

  for (const field of fields) {
    if (!field.enabled) continue
    if (field.key === '__linebreak__') {
      if (currentLine.length) {
        lines.push(currentLine.join(' '))
        currentLine.length = 0
      }
      continue
    }
    const val = vals[field.key]
    if (val) currentLine.push(val)
  }
  if (currentLine.length) lines.push(currentLine.join(' '))
  if (settings.metadataOverrides) lines.push(settings.metadataOverrides)

  if (lines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = theme === 'dark' ? '#e0e0e0' : '#0f172a'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const lineH = settings.spacing.textSize * 1.3
    const textX = settings.spacing.xInset
    // Text goes below the image, or at the bottom of the canvas if image fills it
    const textY = Math.min(dy + drawH + settings.spacing.textOffsetY, height - lines.length * lineH - 16)

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Branding — only in margin area, never on the image
  if (settings.branding.enabled && settings.branding.text && drawH < height) {
    ctx.font = `14px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = theme === 'dark' ? '#888' : '#999'
    ctx.textBaseline = 'bottom'
    const brandY = height - 12
    if (settings.branding.position === 'bottom-left') {
      ctx.textAlign = 'left'
      ctx.fillText(settings.branding.text, 16, brandY)
    } else {
      ctx.textAlign = 'right'
      ctx.fillText(settings.branding.text, width - 16, brandY)
    }
  }

  return canvas
}

export function renderAllImages(
  images: { img: HTMLImageElement; metadata: Partial<NormalizedMetadata> }[],
  target: AppSettings['exportTarget'],
  settings: AppSettings,
  theme: 'light' | 'dark',
): HTMLCanvasElement[] {
  return images.map(img => renderCanvas(img.img, target, img.metadata, settings, theme))
}
