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

  async function loadLogo(): Promise<HTMLImageElement | undefined> {
    if (!settings.branding.logoDataUrl) return undefined
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(undefined)
      img.src = settings.branding.logoDataUrl
    })
  }

  async function handleExport() {
    if (!currentImage) return

    const baseName = currentImage.file.name.replace(/\.[^.]+$/, '')
    const logoImg = await loadLogo()

    if (isCarousel) {
      const panorama = renderCarousel(currentImage.img, settings.exportTarget, settings, currentImage.carouselSlides, logoImg)
      const slices = sliceCarousel(panorama, currentImage.carouselSlides)
      panorama.width = 0
      panorama.height = 0
      await exportCarouselBatch(slices, settings.exportConfig, baseName)
    } else {
      const canvas = renderCanvas(currentImage.img, settings.exportTarget, settings, theme, logoImg)
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
