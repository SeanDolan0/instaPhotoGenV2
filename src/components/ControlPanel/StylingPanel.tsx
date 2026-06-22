import { useSettings } from '../../contexts/SettingsContext'
import { useTheme } from '../../contexts/ThemeContext'
import styles from '../../styles/ControlPanel.module.css'

const FONTS = ['Inter', 'SF Pro', 'Roboto', 'Helvetica', 'Playfair Display', 'Source Serif 4']

export default function StylingPanel() {
  const { settings, settingsDispatch } = useSettings()
  const { theme, toggleTheme } = useTheme()

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Styling</h3>

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

      <div className={styles.fieldRow}>
        <span>Dark Mode</span>
        <button
          className={styles.toggleBtn}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </section>
  )
}
