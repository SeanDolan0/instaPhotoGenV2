import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderCanvas, renderCarousel, sliceCarousel } from '../../lib/renderer'
import { canvasToBlob, exportAllAsZip, type ZipExportEntry } from '../../lib/export'
import { resolveMetadataTextForImage } from '../../hooks/useMetadataText'
import styles from '../../styles/ControlPanel.module.css'

export default function BatchExport() {
  const { settings, images } = useSettings()
  const { theme } = useTheme()
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const hasAnyCarousel = images.some(img => img.carouselSlides >= 2)

  if (images.length < 2) return null

  async function handleExport() {
    setProgress({ current: 0, total: 1 })
    try {
      // Preload logo if branding is enabled with a logo image
      let logoImg: HTMLImageElement | undefined
      if (settings.branding.logoDataUrl) {
        try {
          const img = new Image()
          img.src = settings.branding.logoDataUrl
          if (!img.complete) {
            await new Promise(resolve => {
              img.onload = () => resolve(true)
              img.onerror = () => resolve(false)
            })
          }
          logoImg = img
        } catch { /* ignore */ }
      }

      const entries: ZipExportEntry[] = []
      const ext = settings.exportConfig.format === 'jpeg' ? 'jpg' : 'png'

      for (const image of images) {
        const baseName = image.file.name.replace(/\.[^.]+$/, '')
        const { leftText, rightText } = resolveMetadataTextForImage(image, settings)
        const imageSettings = {
          ...settings,
          metadataText: leftText,
          metadataTextRight: rightText,
        }

        if (image.carouselSlides >= 2) {
          const slides = image.carouselSlides
          let slicesCache: HTMLCanvasElement[] | null = null

          const getSlices = () => {
            if (!slicesCache) {
              const panorama = renderCarousel(image.img, settings.exportTarget, imageSettings, slides, logoImg)
              slicesCache = sliceCarousel(panorama, slides)
              panorama.width = 0
              panorama.height = 0
            }
            return slicesCache
          }

          for (let s = 0; s < slides; s++) {
            const slideIdx = s
            entries.push({
              filename: `${baseName}_${slideIdx + 1}of${slides}.${ext}`,
              getBlob: async () => {
                const loadedSlices = getSlices()
                const sliceCanvas = loadedSlices[slideIdx]
                const blob = await canvasToBlob(sliceCanvas, settings.exportConfig)
                sliceCanvas.width = 0
                sliceCanvas.height = 0
                if (slideIdx === slides - 1) {
                  slicesCache = null
                }
                return blob
              },
            })
          }
        } else {
          entries.push({
            filename: `iphoto_${baseName}.${ext}`,
            getBlob: async () => {
              const canvas = renderCanvas(image.img, settings.exportTarget, imageSettings, theme, logoImg)
              const blob = await canvasToBlob(canvas, settings.exportConfig)
              canvas.width = 0
              canvas.height = 0
              return blob
            },
          })
        }
      }

      await exportAllAsZip(entries, (current, total) => {
        setProgress({ current, total })
      })
    } catch (e) {
      console.error('Batch export failed', e)
    } finally {
      setProgress(null)
    }
  }

  const label = progress
    ? `Exporting ${progress.current} of ${progress.total} (${Math.round((progress.current / Math.max(1, progress.total)) * 100)}%)...`
    : hasAnyCarousel
      ? `Export All (${images.length} images)`
      : `Export All (${images.length})`

  return (
    <section className={styles.section}>
      <button className={styles.exportBtn} onClick={handleExport} disabled={Boolean(progress)}>
        {label}
      </button>
    </section>
  )
}
