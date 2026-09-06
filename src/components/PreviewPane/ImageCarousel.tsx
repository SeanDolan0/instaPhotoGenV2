import { useSettings } from '../../contexts/SettingsContext'
import styles from '../../styles/PreviewPane.module.css'

export default function ImageCarousel() {
  const { images, selectedImageIdx, setSelectedImageIdx, removeImage } = useSettings()

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
          <img
            src={img.thumbnailUrl || img.img.src}
            alt={img.file.name}
            loading="lazy"
          />
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
