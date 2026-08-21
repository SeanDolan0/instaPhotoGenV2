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
  const isCarousel = settings.carouselSlides >= 2

  if (images.length < 2) return null

  async function handleExport() {
    setExporting(true)
    try {
      if (isCarousel) {
        for (const image of images) {
          const panorama = renderCarousel(image.img, settings.exportTarget, settings)
          const slices = sliceCarousel(panorama, settings.carouselSlides)
          const baseName = image.file.name.replace(/\.[^.]+$/, '')
          await exportCarouselBatch(slices, settings.exportConfig, baseName)
        }
      } else {
        const canvases = renderAllImages(images, settings.exportTarget, settings, theme)
        const ext = settings.exportConfig.format === 'jpeg' ? 'jpg' : 'png'
        const items = canvases.map((canvas, i) => ({
          canvas,
          filename: `iphoto_${images[i]?.file.name.replace(/\.[^.]+$/, '') ?? Date.now()}.${ext}`,
        }))
        await exportBatch(items, settings.exportConfig)
      }
    } catch (e) {
      console.error('Batch export failed', e)
    }
    setExporting(false)
  }

  const label = exporting
    ? 'Exporting...'
    : isCarousel
      ? `Export All (${images.length}×${settings.carouselSlides} slides)`
      : `Export All (${images.length})`

  return (
    <section className={styles.section}>
      <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
        {label}
      </button>
    </section>
  )
}
