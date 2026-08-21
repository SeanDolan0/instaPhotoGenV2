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
  const currentImage = images[selectedImageIdx]
  const isCarousel = (currentImage?.carouselSlides ?? 0) >= 2

  async function handleExport() {
    if (!currentImage) return

    const baseName = currentImage.file.name.replace(/\.[^.]+$/, '')

    if (isCarousel) {
      const panorama = renderCarousel(currentImage.img, settings.exportTarget, settings, currentImage.carouselSlides)
      const slices = sliceCarousel(panorama, currentImage.carouselSlides)
      await exportCarouselBatch(slices, settings.exportConfig, baseName)
    } else {
      const canvas = renderCanvas(currentImage.img, settings.exportTarget, settings, theme)
      exportSingle(canvas, settings.exportConfig, baseName)
    }
  }

  return (
    <main className={styles.pane}>
      <div className={styles.header}>
        <h2 className={styles.title}>Preview</h2>
        <div className={styles.actions}>
          {currentImage && (
            <span className={styles.filename}>{currentImage.file.name}</span>
          )}
          <button
            className={styles.downloadBtn}
            onClick={handleExport}
            disabled={!images.length}
          >
            {isCarousel ? `Download ${currentImage.carouselSlides} slides` : 'Download'}
          </button>
        </div>
      </div>
      {isCarousel ? <CarouselPreview /> : <CanvasPreview />}
      <ImageCarousel />
    </main>
  )
}
