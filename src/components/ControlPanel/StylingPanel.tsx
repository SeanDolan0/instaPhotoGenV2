import { useSettings } from '../../contexts/SettingsContext'
import styles from '../../styles/ControlPanel.module.css'

const FONTS = ['Inter', 'SF Pro', 'Roboto', 'Helvetica', 'Playfair Display', 'Source Serif 4']

export default function StylingPanel({ compact }: { compact?: boolean }) {
  const { settings, settingsDispatch } = useSettings()

  return (
    <>
      {!compact && <h3 className={styles.sectionTitle}>Styling</h3>}

      <label className={styles.fieldRow}>
        <span>Font</span>
        <select
          value={settings.fontFamily}
          onChange={e => settingsDispatch({ type: 'SET_FONT', payload: e.target.value })}
        >
          {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>

      <label className={styles.fieldRow}>
        <span>Photo Size</span>
        <div className={styles.sliderGroup}>
          <input
            type="range"
            min={10}
            max={100}
            value={settings.spacing.photoScale}
            onChange={e => settingsDispatch({ type: 'SET_SPACING', payload: { photoScale: Number(e.target.value) } })}
          />
          <span className={styles.sliderVal}>{settings.spacing.photoScale}%</span>
        </div>
      </label>

      <label className={styles.fieldRow}>
        <span>Text Size</span>
        <div className={styles.sliderGroup}>
          <input
            type="range"
            min={18}
            max={128}
            value={settings.spacing.textSize}
            onChange={e => settingsDispatch({ type: 'SET_SPACING', payload: { textSize: Number(e.target.value) } })}
          />
          <span className={styles.sliderVal}>{settings.spacing.textSize}</span>
        </div>
      </label>

      <label className={styles.fieldRow}>
        <span>Text Offset Y</span>
        <div className={styles.sliderGroup}>
          <input
            type="range"
            min={0}
            max={200}
            value={settings.spacing.textOffsetY}
            onChange={e => settingsDispatch({ type: 'SET_SPACING', payload: { textOffsetY: Number(e.target.value) } })}
          />
          <span className={styles.sliderVal}>{settings.spacing.textOffsetY}</span>
        </div>
      </label>

      <label className={styles.fieldRow}>
        <span>X Inset</span>
        <div className={styles.sliderGroup}>
          <input
            type="range"
            min={0}
            max={200}
            value={settings.spacing.xInset}
            onChange={e => settingsDispatch({ type: 'SET_SPACING', payload: { xInset: Number(e.target.value) } })}
          />
          <span className={styles.sliderVal}>{settings.spacing.xInset}</span>
        </div>
      </label>

      <label className={styles.fieldRow}>
        <span>Text Color</span>
        <input
          type="color"
          value={settings.spacing.textColor}
          onChange={e => settingsDispatch({ type: 'SET_SPACING', payload: { textColor: e.target.value } })}
        />
      </label>

    </>
  )
}
