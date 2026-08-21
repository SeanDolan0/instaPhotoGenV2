import { useRef } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import styles from '../../styles/ControlPanel.module.css'

export default function BrandingPanel() {
  const { settings, settingsDispatch } = useSettings()
  const brand = settings.branding
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      settingsDispatch({ type: 'SET_BRANDING', payload: { logoDataUrl: reader.result as string } })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  return (
    <>
      <label className={styles.fieldRow}>
        <span>Watermark</span>
        <input
          type="checkbox"
          checked={brand.enabled}
          onChange={() => settingsDispatch({ type: 'SET_BRANDING', payload: { enabled: !brand.enabled } })}
        />
      </label>

      {brand.enabled && (
        <div className={styles.brandFields}>
          <input
            type="text"
            placeholder="Brand text..."
            value={brand.text}
            onChange={e => settingsDispatch({ type: 'SET_BRANDING', payload: { text: e.target.value } })}
            className={styles.brandInput}
          />

          <label className={styles.fieldRow}>
            <span>Position</span>
            <select
              value={brand.position}
              onChange={e => settingsDispatch({ type: 'SET_BRANDING', payload: { position: e.target.value as 'bottom-left' | 'bottom-right' } })}
            >
              <option value="bottom-left">Bottom Left</option>
              <option value="bottom-right">Bottom Right</option>
            </select>
          </label>

          <div className={styles.fieldRow}>
            <span>Logo</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className={styles.sideBtn}
                style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
                onClick={() => fileInputRef.current?.click()}
              >
                {brand.logoDataUrl ? 'Change' : 'Upload'}
              </button>
              {brand.logoDataUrl && (
                <button
                  type="button"
                  className={styles.sideBtn}
                  style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px', color: '#c87070' }}
                  onClick={() => settingsDispatch({ type: 'SET_BRANDING', payload: { logoDataUrl: '' } })}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {brand.logoDataUrl && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}>
                <img
                  src={brand.logoDataUrl}
                  alt="Logo preview"
                  style={{ height: 24, maxWidth: 80, objectFit: 'contain', borderRadius: 2 }}
                />
              </div>
              <label className={styles.fieldRow}>
                <span>Logo Size</span>
                <div className={styles.sliderGroup}>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={brand.logoHeight}
                    onChange={e => settingsDispatch({ type: 'SET_BRANDING', payload: { logoHeight: Number(e.target.value) } })}
                  />
                  <span className={styles.sliderVal}>{brand.logoHeight}px</span>
                </div>
              </label>
            </>
          )}
        </div>
      )}
    </>
  )
}
