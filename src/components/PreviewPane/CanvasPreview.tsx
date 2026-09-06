import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderCanvas } from '../../lib/renderer'
import styles from '../../styles/PreviewPane.module.css'

export default function CanvasPreview() {
  const { settings, images, selectedImageIdx } = useSettings()
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  // Preload logo image when data URL changes
  useEffect(() => {
    const dataUrl = settings.branding.logoDataUrl
    if (!dataUrl) {
      setLogoImg(null)
      return
    }
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = dataUrl
  }, [settings.branding.logoDataUrl])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const prev = container.querySelector('canvas')
    if (prev) {
      prev.width = 0
      prev.height = 0
      prev.remove()
    }

    const image = images[selectedImageIdx]
    if (!image) return

    try {
      const canvas = renderCanvas(
        image.img,
        settings.exportTarget,
        settings,
        theme,
        logoImg ?? undefined,
      )
      canvas.style.maxWidth = '100%'
      canvas.style.height = 'auto'
      canvas.style.borderRadius = '4px'
      canvas.style.boxShadow = 'var(--shadow-lg)'
      container.appendChild(canvas)
    } catch (e) {
      console.error('Render failed', e)
    }

    return () => {
      const current = container.querySelector('canvas')
      if (current) {
        current.width = 0
        current.height = 0
        current.remove()
      }
    }
  }, [settings, images, selectedImageIdx, theme, logoImg])

  if (!images.length) {
    return (
      <div className={styles.empty}>
        <p>Upload an image to get started</p>
      </div>
    )
  }

  return <div ref={containerRef} className={styles.canvasWrap} />
}
