import { useRef, useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { processImageFiles } from '../../lib/exif'
import styles from '../../styles/ControlPanel.module.css'

export default function UploadSection() {
  const { addImages, clearImages, images } = useSettings()
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  async function handleFiles(fileList: FileList) {
    if (!fileList.length) return
    setProgress({ current: 0, total: fileList.length })
    try {
      await processImageFiles(
        fileList,
        (chunk) => addImages(chunk),
        (current, total) => setProgress({ current, total }),
        3,
      )
    } finally {
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <div
        className={`${styles.dropZone} ${progress ? styles.dropZoneActive : ''}`}
        onClick={() => !progress && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && !progress) inputRef.current?.click() }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.jpg,.jpeg,.png,.webp,.avif,.tif,.tiff"
          multiple
          hidden
          disabled={Boolean(progress)}
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <span className={styles.dropText}>
          {progress
            ? `Loading photos: ${progress.current} of ${progress.total}...`
            : images.length
              ? `${images.length} image${images.length > 1 ? 's' : ''} loaded`
              : 'Click to browse images'}
        </span>
      </div>
      {images.length > 0 && !progress && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
          <button
            type="button"
            className={styles.resetBtn}
            style={{ color: '#c87070' }}
            onClick={clearImages}
            title="Remove all loaded photos"
          >
            Clear All Photos
          </button>
        </div>
      )}
    </>
  )
}
