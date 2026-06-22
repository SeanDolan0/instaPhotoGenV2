import type { AppSettings, NormalizedMetadata } from '../types'
import { getTargetDimensions } from './targets'

export function renderCanvas(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  _metadata: Partial<NormalizedMetadata>,
  settings: AppSettings,
  theme: 'light' | 'dark',
): HTMLCanvasElement {
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  // Use target only for aspect ratio — canvas size preserves full image resolution
  const dims = getTargetDimensions(target)
  const targetAr = dims.width / dims.height

  // Smallest rectangle at targetAr that fully contains the original image
  const canvasW = Math.max(imgW, Math.round(imgH * targetAr))
  const canvasH = Math.round(canvasW / targetAr)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  // Background — fixed white, independent of theme
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Draw image at native resolution (1:1), centered — no downscaling
  const photoScale = settings.spacing.photoScale / 100
  const drawW = Math.round(imgW * photoScale)
  const drawH = Math.round(imgH * photoScale)
  const dx = Math.round((canvasW - drawW) / 2)
  const dy = Math.round((canvasH - drawH) / 2)
  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Metadata text
  const lines = settings.metadataText ? settings.metadataText.split('\n') : []

  if (lines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const lineH = settings.spacing.textSize * 1.3
    const textX = dx + settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Right-side text
  const rightLines = settings.metadataTextRight ? settings.metadataTextRight.split('\n') : []

  if (rightLines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    const lineH = settings.spacing.textSize * 1.3
    const textX = dx + drawW - settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    rightLines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Branding — only in margin area, never on the image
  if (settings.branding.enabled && settings.branding.text && drawH < canvasH) {
    ctx.font = `14px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = theme === 'dark' ? '#888' : '#999'
    ctx.textBaseline = 'bottom'
    const brandY = canvasH - 12
    if (settings.branding.position === 'bottom-left') {
      ctx.textAlign = 'left'
      ctx.fillText(settings.branding.text, 16, brandY)
    } else {
      ctx.textAlign = 'right'
      ctx.fillText(settings.branding.text, canvasW - 16, brandY)
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
