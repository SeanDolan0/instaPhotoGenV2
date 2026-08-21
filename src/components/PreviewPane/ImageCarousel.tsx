import { useEffect, useMemo } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import styles from '../../styles/PreviewPane.module.css'

export default function ImageCarousel() {
  const { images, selectedImageIdx, setSelectedImageIdx, removeImage } = useSettings()

  // Create blob URLs once per image, revoke on unmount
  const urls = useMemo(
    () => images.map(img => URL.createObjectURL(img.file)),
    [images],
  )

  useEffect(() => {
    return () => urls.forEach(URL.revokeObjectURL)
  }, [urls])

  if (images.length < 2) return null

  return (
    <div className={styles.carousel}>
      {images.map((img, idx) => (
        <button
          key={img.id}
          className={`${styles.thumb} ${idx === selectedImageIdx ? styles.thumbActive : ''}`}
          onClick={() => setSelectedImageIdx(idx)}
          title={img.file.name}
        >
          <img src={urls[idx]} alt={img.file.name} />
          <span
            className={styles.thumbRemove}
            onClick={e => { e.stopPropagation(); removeImage(img.id) }}
          >
            ×
          </span>
        </button>
      ))}
    </div>
  )
}
