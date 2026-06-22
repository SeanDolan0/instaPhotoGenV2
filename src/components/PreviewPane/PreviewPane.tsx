import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderCanvas } from '../../lib/renderer'
import { exportSingle } from '../../lib/export'
import CanvasPreview from './CanvasPreview'
import ImageCarousel from './ImageCarousel'
import styles from '../../styles/PreviewPane.module.css'

export default function PreviewPane() {
  const { settings, images, selectedImageIdx } = useSettings()
  const { theme } = useTheme()

  function handleExport() {
    const image = images[selectedImageIdx]
    if (!image) return
    const canvas = renderCanvas(image.img, settings.exportTarget, image.metadata, settings, theme)
    exportSingle(canvas)
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
            Download
          </button>
        </div>
      </div>
      <CanvasPreview />
      <ImageCarousel />
    </main>
  )
}
