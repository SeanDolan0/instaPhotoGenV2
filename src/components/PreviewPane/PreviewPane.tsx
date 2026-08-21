import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderCanvas, renderCarousel, sliceCarousel } from '../../lib/renderer'
import { exportSingle, exportCarouselBatch } from '../../lib/export'
import CanvasPreview from './CanvasPreview'
import CarouselPreview from './CarouselPreview'
import ImageCarousel from './ImageCarousel'
import styles from '../../styles/PreviewPane.module.css'

export default function PreviewPane() {
  const { settings, images, selectedImageIdx } = useSettings()
  const { theme } = useTheme()
  const isCarousel = settings.carouselSlides >= 2

  async function handleExport() {
    const image = images[selectedImageIdx]
    if (!image) return

    const baseName = image.file.name.replace(/\.[^.]+$/, '')

    if (isCarousel) {
      const panorama = renderCarousel(image.img, settings.exportTarget, settings)
      const slices = sliceCarousel(panorama, settings.carouselSlides)
      await exportCarouselBatch(slices, settings.exportConfig, baseName)
    } else {
      const canvas = renderCanvas(image.img, settings.exportTarget, settings, theme)
      exportSingle(canvas, settings.exportConfig, baseName)
    }
  }

  return (
    <main className={styles.pane}>
      <div className={styles.header}>
        <h2 className={styles.title}>Preview</h2>
        <div className={styles.actions}>
          {images[selectedImageIdx] && (
            <span className={styles.filename}>{images[selectedImageIdx].file.name}</span>
          )}
          <button
            className={styles.downloadBtn}
            onClick={handleExport}
            disabled={!images.length}
          >
            {isCarousel ? `Download ${settings.carouselSlides} slides` : 'Download'}
          </button>
        </div>
      </div>
      {isCarousel ? <CarouselPreview /> : <CanvasPreview />}
      <ImageCarousel />
    </main>
  )
}
