import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import { renderAllImages } from '../../lib/renderer'
import { exportBatch } from '../../lib/export'
import styles from '../../styles/ControlPanel.module.css'

export default function BatchExport() {
  const { settings, images } = useSettings()
  const { theme } = useTheme()
  const [exporting, setExporting] = useState(false)

  if (images.length < 2) return null

  async function handleExport() {
    setExporting(true)
    try {
      const canvases = renderAllImages(images, settings.exportTarget, settings, theme)
      const items = canvases.map((canvas, i) => ({ canvas, metadata: images[i]?.metadata ?? {} }))
      await exportBatch(items)
    } catch (e) {
      console.error('Batch export failed', e)
    }
    setExporting(false)
  }

  return (
    <section className={styles.section}>
      <button className={styles.exportBtn} onClick={handleExport} disabled={exporting}>
        {exporting ? 'Exporting...' : `Export All (${images.length})`}
      </button>
    </section>
  )
}
