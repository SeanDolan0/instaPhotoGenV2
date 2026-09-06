import type { AppSettings } from '../types'
import { getTargetDimensions } from './targets'

function getContrastWatermarkColor(bgColorHex: string): string {
  try {
    const hex = bgColorHex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16) || 255
    const g = parseInt(hex.substring(2, 4), 16) || 255
    const b = parseInt(hex.substring(4, 6), 16) || 255
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance < 0.5 ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.45)'
  } catch {
    return 'rgba(0, 0, 0, 0.45)'
  }
}

export function renderCanvas(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  settings: AppSettings,
  _theme?: 'light' | 'dark',
  logoImg?: HTMLImageElement,
): HTMLCanvasElement {
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  const dims = getTargetDimensions(target, imgW, imgH)
  const targetAr = dims.width / dims.height

  const canvasW = Math.max(imgW, Math.round(imgH * targetAr))
  const canvasH = Math.round(canvasW / targetAr)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = settings.spacing.backgroundColor || '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Compute a scale factor relative to a standard 1080px canvas dimension
  // so text and spacing visually maintain the exact same relative size regardless of photo resolution or crop.
  const baseDim = Math.min(canvasW, canvasH)
  const scaleFactor = baseDim / 1080

  const scaledTextSize = Math.max(8, Math.round((settings.spacing.textSize || 32) * scaleFactor))
  const scaledTextOffsetY = Math.round((settings.spacing.textOffsetY || 32) * scaleFactor)
  const scaledXInset = Math.round((settings.spacing.xInset || 32) * scaleFactor)
  const lineH = Math.round(scaledTextSize * (settings.spacing.lineHeight || 1.3))

  // Metadata lines
  const lines = settings.metadataText ? settings.metadataText.split('\n') : []
  const rightLines = settings.metadataTextRight ? settings.metadataTextRight.split('\n') : []

  const photoScale = (settings.spacing.photoScale || 100) / 100
  const drawW = Math.round(imgW * photoScale)
  const drawH = Math.round(imgH * photoScale)
  const dx = Math.round((canvasW - drawW) / 2)
  const dy = Math.round((canvasH - drawH) / 2)

  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Left-side metadata text
  if (lines.length) {
    ctx.font = `${scaledTextSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor || '#0f172a'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const textX = dx + scaledXInset
    const textY = dy + drawH + scaledTextOffsetY

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Right-side metadata text
  if (rightLines.length) {
    ctx.font = `${scaledTextSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor || '#0f172a'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    const textX = dx + drawW - scaledXInset
    const textY = dy + drawH + scaledTextOffsetY

    rightLines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Branding + logo
  if (settings.branding.enabled) {
    const brandMargin = Math.round(16 * scaleFactor)
    const brandY = canvasH - Math.round(12 * scaleFactor)
    const contrastColor = getContrastWatermarkColor(settings.spacing.backgroundColor || '#ffffff')

    // Logo image
    if (logoImg && logoImg.naturalWidth > 0) {
      const logoH = Math.round((settings.branding.logoHeight || 40) * scaleFactor)
      const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight))
      const logoX = settings.branding.position === 'bottom-left'
        ? brandMargin
        : canvasW - brandMargin - logoW
      ctx.drawImage(logoImg, logoX, brandY - logoH, logoW, logoH)
    }

    // Brand text
    if (settings.branding.text) {
      const brandFontSize = Math.max(9, Math.round(14 * scaleFactor))
      ctx.font = `${brandFontSize}px "${settings.fontFamily}", system-ui, sans-serif`
      ctx.fillStyle = contrastColor
      ctx.textBaseline = 'bottom'
      if (settings.branding.position === 'bottom-left') {
        ctx.textAlign = 'left'
        ctx.fillText(settings.branding.text, brandMargin, brandY)
      } else {
        ctx.textAlign = 'right'
        ctx.fillText(settings.branding.text, canvasW - brandMargin, brandY)
      }
    }
  }

  return canvas
}

export function renderCarousel(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  settings: AppSettings,
  slides: number,
  logoImg?: HTMLImageElement,
): HTMLCanvasElement {
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  const dims = getTargetDimensions(target, imgW, imgH)
  const targetAr = dims.width / dims.height

  let singleW = Math.max(imgW, Math.round(imgH * targetAr))
  let singleH = Math.round(singleW / targetAr)

  // Safety clamp total panorama width to avoid browser canvas memory crash (max 12000px)
  const maxTotalW = 12000
  if (singleW * slides > maxTotalW) {
    const scale = maxTotalW / (singleW * slides)
    singleW = Math.round(singleW * scale)
    singleH = Math.round(singleH * scale)
  }

  const canvasW = singleW * slides
  const canvasH = singleH

  const baseScale = Math.min(canvasW / imgW, canvasH / imgH)
  const photoScale = ((settings.spacing.photoScale || 100) / 100) * baseScale
  const drawW = Math.round(imgW * photoScale)
  const drawH = Math.round(imgH * photoScale)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = settings.spacing.backgroundColor || '#ffffff'
  ctx.fillRect(0, 0, canvasW, canvasH)

  const dx = Math.round((canvasW - drawW) / 2)
  const dy = Math.round((canvasH - drawH) / 2)
  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Compute scale factor based on standard slide height (1080px base)
  const scaleFactor = singleH / 1080
  const scaledTextSize = Math.max(8, Math.round((settings.spacing.textSize || 32) * scaleFactor))
  const scaledTextOffsetY = Math.round((settings.spacing.textOffsetY || 32) * scaleFactor)
  const scaledXInset = Math.round((settings.spacing.xInset || 32) * scaleFactor)
  const lineH = Math.round(scaledTextSize * (settings.spacing.lineHeight || 1.3))

  // Left-side metadata text
  const lines = settings.metadataText ? settings.metadataText.split('\n') : []
  if (lines.length) {
    ctx.font = `${scaledTextSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor || '#0f172a'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const textX = dx + scaledXInset
    const textY = dy + drawH + scaledTextOffsetY

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Right-side metadata text
  const rightLines = settings.metadataTextRight ? settings.metadataTextRight.split('\n') : []
  if (rightLines.length) {
    ctx.font = `${scaledTextSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor || '#0f172a'
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    const textX = dx + drawW - scaledXInset
    const textY = dy + drawH + scaledTextOffsetY

    rightLines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Branding in carousel mode
  if (settings.branding.enabled) {
    const brandMargin = Math.round(16 * scaleFactor)
    const brandY = canvasH - Math.round(12 * scaleFactor)
    const contrastColor = getContrastWatermarkColor(settings.spacing.backgroundColor || '#ffffff')

    if (logoImg && logoImg.naturalWidth > 0) {
      const logoH = Math.round((settings.branding.logoHeight || 40) * scaleFactor)
      const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight))
      const logoX = settings.branding.position === 'bottom-left'
        ? brandMargin
        : canvasW - brandMargin - logoW
      ctx.drawImage(logoImg, logoX, brandY - logoH, logoW, logoH)
    }

    if (settings.branding.text) {
      const brandFontSize = Math.max(9, Math.round(14 * scaleFactor))
      ctx.font = `${brandFontSize}px "${settings.fontFamily}", system-ui, sans-serif`
      ctx.fillStyle = contrastColor
      ctx.textBaseline = 'bottom'
      if (settings.branding.position === 'bottom-left') {
        ctx.textAlign = 'left'
        ctx.fillText(settings.branding.text, brandMargin, brandY)
      } else {
        ctx.textAlign = 'right'
        ctx.fillText(settings.branding.text, canvasW - brandMargin, brandY)
      }
    }
  }

  return canvas
}

export function sliceCarousel(
  panorama: HTMLCanvasElement,
  slides: number,
): HTMLCanvasElement[] {
  const sliceW = Math.round(panorama.width / slides)
  const sliceH = panorama.height
  const slices: HTMLCanvasElement[] = []

  for (let i = 0; i < slides; i++) {
    const canvas = document.createElement('canvas')
    canvas.width = sliceW
    canvas.height = sliceH
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(panorama, i * sliceW, 0, sliceW, sliceH, 0, 0, sliceW, sliceH)
    slices.push(canvas)
  }
  return slices
}

export function renderAllImages(
  images: { img: HTMLImageElement }[],
  target: AppSettings['exportTarget'],
  settings: AppSettings,
  theme: 'light' | 'dark',
  logoImg?: HTMLImageElement,
): HTMLCanvasElement[] {
  return images.map(img => renderCanvas(img.img, target, settings, theme, logoImg))
}
