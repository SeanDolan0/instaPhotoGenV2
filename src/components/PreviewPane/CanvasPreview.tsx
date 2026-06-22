import { useEffect, useRef } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderCanvas } from '../../lib/renderer'
import styles from '../../styles/PreviewPane.module.css'

export default function CanvasPreview() {
  const { settings, images, selectedImageIdx } = useSettings()
  const { theme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Clear previous canvas
    container.innerHTML = ''

    const image = images[selectedImageIdx]
    if (!image) return

    try {
      const canvas = renderCanvas(image.img, settings.exportTarget, image.metadata, settings, theme)
      canvas.style.maxWidth = '100%'
      canvas.style.height = 'auto'
      canvas.style.borderRadius = '4px'
      canvas.style.boxShadow = 'var(--shadow-lg)'
      container.appendChild(canvas)
    } catch (e) {
      console.error('Render failed', e)
    }
  }, [settings, images, selectedImageIdx, theme])

  if (!images.length) {
    return (
      <div className={styles.empty}>
        <p>Upload an image to get started</p>
      </div>
    )
  }

  return <div ref={containerRef} className={styles.canvasWrap} />
}
