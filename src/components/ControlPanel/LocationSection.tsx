import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import LocationMap from './LocationMap'
import styles from '../../styles/ControlPanel.module.css'

export default function LocationSection() {
  const { settings, settingsDispatch, images, selectedImageIdx } = useSettings()
  const { location } = settings
  const [showMap, setShowMap] = useState(false)
  const [overrideActive, setOverrideActive] = useState(false)

  const hasMultiple = images.length >= 2
  const currentImageId = images[selectedImageIdx]?.id

  const displayText = overrideActive && currentImageId
    ? (location.perPhoto[currentImageId] ?? '')
    : location.text

  function handleTextChange(value: string) {
    if (overrideActive && currentImageId) {
      settingsDispatch({ type: 'SET_LOCATION_PER_PHOTO', payload: { imageId: currentImageId, text: value } })
    } else {
      settingsDispatch({ type: 'SET_LOCATION_TEXT', payload: value })
    }
  }

  function handleOverrideToggle(checked: boolean) {
    setOverrideActive(checked)
    if (checked && currentImageId && !location.perPhoto[currentImageId]) {
      settingsDispatch({ type: 'SET_LOCATION_PER_PHOTO', payload: { imageId: currentImageId, text: location.text } })
    }
  }

  return (
    <>
      <input
        type="text"
        value={displayText}
        onChange={e => handleTextChange(e.target.value)}
        placeholder="e.g. Kyoto, Japan"
        className={styles.brandInput}
      />

      <div className={styles.formatToggle}>
        {(['name', 'coordinates', 'both'] as const).map(fmt => (
          <button
            key={fmt}
            className={`${styles.formatBtn} ${location.format === fmt ? styles.formatBtnActive : ''}`}
            onClick={() => settingsDispatch({ type: 'SET_LOCATION_FORMAT', payload: fmt })}
          >
            {fmt === 'name' ? 'Name' : fmt === 'coordinates' ? 'Coords' : 'Both'}
          </button>
        ))}
      </div>

      <div className={styles.formatToggle}>
        <button
          className={`${styles.formatBtn} ${location.side === 'left' ? styles.formatBtnActive : ''}`}
          onClick={() => settingsDispatch({ type: 'SET_LOCATION_SIDE', payload: 'left' })}
        >
          ← Left
        </button>
        <button
          className={`${styles.formatBtn} ${location.side === 'right' ? styles.formatBtnActive : ''}`}
          onClick={() => settingsDispatch({ type: 'SET_LOCATION_SIDE', payload: 'right' })}
        >
          Right →
        </button>
      </div>

      {hasMultiple && (
        <label className={styles.metaLabel}>
          <input
            type="checkbox"
            checked={overrideActive}
            onChange={e => handleOverrideToggle(e.target.checked)}
          />
          <span>Override for selected photo</span>
          {overrideActive && currentImageId && (
            <span className={styles.overrideIndicator}>
              {images[selectedImageIdx]?.file.name}
            </span>
          )}
        </label>
      )}

      <button
        className={`${styles.formatBtn} ${showMap ? styles.formatBtnActive : ''}`}
        onClick={() => setShowMap(!showMap)}
        style={{ marginTop: 8, width: '100%' }}
      >
        {showMap ? 'Hide map' : 'Pick on map'}
      </button>

      {showMap && (
        <LocationMap
          lat={location.lat}
          lng={location.lng}
          onPick={(lat, lng, name) => {
            settingsDispatch({ type: 'SET_LOCATION_COORDS', payload: { lat, lng } })
            if (name) handleTextChange(name)
          }}
        />
      )}
    </>
  )
}
