import { useRef, useState, type DragEvent } from 'react'
import type { ImageEntry } from '../../types'
import { useSettings } from '../../contexts/SettingsContext'
import { loadImage, extractMetadata } from '../../lib/exif'
import styles from '../../styles/ControlPanel.module.css'

export default function UploadSection({ compact }: { compact?: boolean }) {
  const { addImages, images } = useSettings()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/'))
    if (!files.length) return

    const entries = await Promise.all(
      files.map(async (file) => {
        try {
          const [img, metadata] = await Promise.all([
            loadImage(file),
            extractMetadata(file),
          ])
          return { id: crypto.randomUUID(), file, img, metadata }
        } catch {
          return null
        }
      }),
    )

    addImages(entries.filter(Boolean) as ImageEntry[])
  }

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    setDragging(true)
  }

  function onDragLeave() { setDragging(false) }

  return (
    <>
      {!compact && <h3 className={styles.sectionTitle}>Photos</h3>}
      <div
        className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
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
            : 'Drop images here or click to browse'}
        </span>
      </div>
    </>
  )
}
