import { useSettings } from '../../contexts/SettingsContext'
import styles from '../../styles/ControlPanel.module.css'

export default function BrandingPanel() {
  const { settings, settingsDispatch } = useSettings()
  const brand = settings.branding

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>
        Branding
        <label className={styles.toggleInline}>
          <input
            type="checkbox"
            checked={brand.enabled}
            onChange={() => settingsDispatch({ type: 'SET_BRANDING', payload: { enabled: !brand.enabled } })}
          />
        </label>
      </h3>

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
        </div>
      )}
    </section>
  )
}
