import { useEffect, useRef, useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { renderCarousel, sliceCarousel } from '../../lib/renderer'
import styles from '../../styles/PreviewPane.module.css'

export default function CarouselPreview() {
  const { settings, images, selectedImageIdx } = useSettings()
  const containerRef = useRef<HTMLDivElement>(null)
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null)

  useEffect(() => {
    const dataUrl = settings.branding.logoDataUrl
    if (!dataUrl) {
      setLogoImg(null)
      return
    }
    const img = new Image()
    img.onload = () => setLogoImg(img)
    img.src = dataUrl
  }, [settings.branding.logoDataUrl])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.querySelectorAll('canvas').forEach(c => {
      c.width = 0
      c.height = 0
    })
    container.innerHTML = ''

    const image = images[selectedImageIdx]
    if (!image) return

    const slides = image.carouselSlides
    if (slides < 2) return

    try {
      const panorama = renderCarousel(image.img, settings.exportTarget, settings, slides, logoImg ?? undefined)
      const slices = sliceCarousel(panorama, slides)
      panorama.width = 0
      panorama.height = 0

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

    return () => {
      container.querySelectorAll('canvas').forEach(c => {
        c.width = 0
        c.height = 0
      })
      container.innerHTML = ''
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
