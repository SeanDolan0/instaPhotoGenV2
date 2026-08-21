import { useEffect, useRef } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { renderCarousel, sliceCarousel } from '../../lib/renderer'
import styles from '../../styles/PreviewPane.module.css'

export default function CarouselPreview() {
  const { settings, images, selectedImageIdx } = useSettings()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.innerHTML = ''

    const image = images[selectedImageIdx]
    if (!image) return

    const slides = image.carouselSlides
    if (slides < 2) return

    try {
      const panorama = renderCarousel(image.img, settings.exportTarget, settings)
      const slices = sliceCarousel(panorama, slides)

      slices.forEach((slice, i) => {
        const sliceDiv = document.createElement('div')
        sliceDiv.className = styles.carouselSlice
        slice.style.width = '100%'
        slice.style.height = 'auto'
        slice.style.display = 'block'
        sliceDiv.appendChild(slice)
        container.appendChild(sliceDiv)

        if (i < slices.length - 1) {
          const divider = document.createElement('div')
          divider.className = styles.carouselDivider
          container.appendChild(divider)
        }
      })
    } catch (e) {
      console.error('Carousel render failed', e)
    }
  }, [settings, images, selectedImageIdx])

  if (!images.length) {
    return (
      <div className={styles.empty}>
        <p>Upload an image to get started</p>
      </div>
    )
  }

  return (
    <div className={styles.carouselWrap} ref={containerRef} />
  )
}
