import type { AppSettings } from '../types'
import { getTargetDimensions } from './targets'

export function renderCanvas(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  settings: AppSettings,
  theme: 'light' | 'dark',
  logoImg?: HTMLImageElement,
): HTMLCanvasElement {
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  const dims = getTargetDimensions(target)
  const targetAr = dims.width / dims.height

  const canvasW = Math.max(imgW, Math.round(imgH * targetAr))
  const canvasH = Math.round(canvasW / targetAr)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = settings.spacing.backgroundColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  const photoScale = settings.spacing.photoScale / 100
  const drawW = Math.round(imgW * photoScale)
  const drawH = Math.round(imgH * photoScale)
  const dx = Math.round((canvasW - drawW) / 2)
  const dy = Math.round((canvasH - drawH) / 2)
  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Left-side metadata text
  const lines = settings.metadataText ? settings.metadataText.split('\n') : []
  if (lines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const lineH = settings.spacing.textSize * settings.spacing.lineHeight
    const textX = dx + settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Right-side metadata text
  const rightLines = settings.metadataTextRight ? settings.metadataTextRight.split('\n') : []
  if (rightLines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    const lineH = settings.spacing.textSize * settings.spacing.lineHeight
    const textX = dx + drawW - settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    rightLines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Branding + logo — only in margin area, never on the image
  if (settings.branding.enabled && drawH < canvasH) {
    const brandY = canvasH - 12

    // Logo image
    if (logoImg && logoImg.naturalWidth > 0) {
      const logoH = settings.branding.logoHeight
      const logoW = Math.round(logoH * (logoImg.naturalWidth / logoImg.naturalHeight))
      const logoX = settings.branding.position === 'bottom-left'
        ? 16
        : canvasW - 16 - logoW
      ctx.drawImage(logoImg, logoX, brandY - logoH, logoW, logoH)
    }

    // Brand text
    if (settings.branding.text) {
      ctx.font = `14px "${settings.fontFamily}", system-ui, sans-serif`
      ctx.fillStyle = theme === 'dark' ? '#888' : '#999'
      ctx.textBaseline = 'bottom'
      if (settings.branding.position === 'bottom-left') {
        ctx.textAlign = 'left'
        ctx.fillText(settings.branding.text, 16, brandY)
      } else {
        ctx.textAlign = 'right'
        ctx.fillText(settings.branding.text, canvasW - 16, brandY)
      }
    }
  }

  return canvas
}

export function renderCarousel(
  image: HTMLImageElement,
  target: AppSettings['exportTarget'],
  settings: AppSettings,
): HTMLCanvasElement {
  const slides = settings.carouselSlides
  const imgW = image.naturalWidth
  const imgH = image.naturalHeight

  const dims = getTargetDimensions(target)
  const targetAr = dims.width / dims.height

  // Canvas sized from the photo's native dimensions, expanded to match target aspect.
  const singleW = Math.max(imgW, Math.round(imgH * targetAr))
  const singleH = Math.round(singleW / targetAr)

  // Panorama canvas
  const canvasW = singleW * slides
  const canvasH = singleH

  // contain-fit at 100%: photo touches the constrained axis edge-to-edge, never crops.
  // Slider only scales DOWN from 100% (increasing white space).
  const baseScale = Math.min(canvasW / imgW, canvasH / imgH)
  const photoScale = (settings.spacing.photoScale / 100) * baseScale
  const drawW = Math.round(imgW * photoScale)
  const drawH = Math.round(imgH * photoScale)

  const canvas = document.createElement('canvas')
  canvas.width = canvasW
  canvas.height = canvasH
  const ctx = canvas.getContext('2d')!

  // White background
  ctx.fillStyle = settings.spacing.backgroundColor
  ctx.fillRect(0, 0, canvasW, canvasH)

  // Center photo vertically and horizontally across full panorama
  const dx = Math.round((canvasW - drawW) / 2)
  const dy = Math.round((canvasH - drawH) / 2)
  ctx.drawImage(image, dx, dy, drawW, drawH)

  // Left-side metadata text
  const lines = settings.metadataText ? settings.metadataText.split('\n') : []
  if (lines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'left'

    const lineH = settings.spacing.textSize * settings.spacing.lineHeight
    const textX = dx + settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    lines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
  }

  // Right-side metadata text
  const rightLines = settings.metadataTextRight ? settings.metadataTextRight.split('\n') : []
  if (rightLines.length) {
    ctx.font = `${settings.spacing.textSize}px "${settings.fontFamily}", system-ui, sans-serif`
    ctx.fillStyle = settings.spacing.textColor
    ctx.textBaseline = 'top'
    ctx.textAlign = 'right'

    const lineH = settings.spacing.textSize * settings.spacing.lineHeight
    const textX = dx + drawW - settings.spacing.xInset
    const textY = dy + drawH + settings.spacing.textOffsetY

    rightLines.forEach((line, i) => {
      ctx.fillText(line, textX, textY + i * lineH)
    })
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
