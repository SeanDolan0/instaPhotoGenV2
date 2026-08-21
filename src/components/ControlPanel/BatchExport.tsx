import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderAllImages, renderCarousel, sliceCarousel } from '../../lib/renderer'
import { exportBatch, exportCarouselBatch } from '../../lib/export'
import styles from '../../styles/ControlPanel.module.css'

export default function BatchExport() {
  const { settings, images } = useSettings()
  const { theme } = useTheme()
  const [exporting, setExporting] = useState(false)
  const hasAnyCarousel = images.some(img => img.carouselSlides >= 2)

  if (images.length < 2) return null

  async function handleExport() {
    setExporting(true)
    try {
      for (const image of images) {
        if (image.carouselSlides >= 2) {
          const panorama = renderCarousel(image.img, settings.exportTarget, settings, image.carouselSlides)
          const slices = sliceCarousel(panorama, image.carouselSlides)
          const baseName = image.file.name.replace(/\.[^.]+$/, '')
          await exportCarouselBatch(slices, settings.exportConfig, baseName)
        } else {
          const canvases = renderAllImages([image], settings.exportTarget, settings, theme)
          const ext = settings.exportConfig.format === 'jpeg' ? 'jpg' : 'png'
          const items = canvases.map(canvas => ({
            canvas,
            filename: `iphoto_${image.file.name.replace(/\.[^.]+$/, '')}.${ext}`,
          }))
          await exportBatch(items, settings.exportConfig)
        }
      }
    } catch (e) {
      console.error('Batch export failed', e)
    }
    setExporting(false)
  }

  const label = exporting
    ? 'Exporting...'
    : hasAnyCarousel
      ? `Export All (${images.length} images)`
      : `Export All (${images.length})`

  return (
    <section className={styles.section}>
      <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
        {label}
      </button>
    </section>
  )
}
