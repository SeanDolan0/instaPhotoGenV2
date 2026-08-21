import { useRef } from 'react'
import type { ImageEntry } from '../../types'
import { useSettings } from '../../contexts/SettingsContext'
import { loadImage, extractMetadata } from '../../lib/exif'
import styles from '../../styles/ControlPanel.module.css'

export default function UploadSection() {
  const { addImages, images } = useSettings()
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!files.length) return
    const entries = await Promise.all(
      files.map(async (file) => {
        try {
          const [img, metadata] = await Promise.all([loadImage(file), extractMetadata(file)])
          return { id: crypto.randomUUID(), file, img, metadata, carouselSlides: 0 }
        } catch { return null }
      }),
    )
    addImages(entries.filter(Boolean) as ImageEntry[])
  }

  return (
    <>
      <div
        className={styles.dropZone}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => e.target.files && handleFiles(e.target.files)}
        />
        <span className={styles.dropText}>
          {images.length
            ? `${images.length} image${images.length > 1 ? 's' : ''} loaded`
            : 'Click to browse images'}
        </span>
      </div>
    </>
  )
}
