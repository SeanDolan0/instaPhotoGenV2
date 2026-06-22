import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { presetsGrouped } from '../../lib/targets'
import styles from '../../styles/ControlPanel.module.css'

export default function ExportTargetSelect() {
  const { settings, settingsDispatch } = useSettings()
  const [custom, setCustom] = useState(
    settings.exportTarget.type === 'custom'
      ? settings.exportTarget.dimensions
      : { width: 1920, height: 1080 },
  )

  function aspectRatio(w: number, h: number): string {
    const g = (a: number, b: number): number => b === 0 ? a : g(b, a % b)
    const d = g(w, h)
    return `${w / d}:${h / d}`
  }

  const groups = presetsGrouped()
  const isCustom = settings.exportTarget.type === 'custom'

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Export Target</h3>
      <select
        value={settings.exportTarget.type === 'preset' ? settings.exportTarget.key : '__custom__'}
        onChange={e => {
          if (e.target.value === '__custom__') {
            settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: custom } })
          } else {
            settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'preset', key: e.target.value } })
          }
        }}
      >
        {Object.entries(groups).map(([group, presets]) => (
          <optgroup key={group} label={group}>
            {presets.map(p => (
              <option key={p.key} value={p.key}>{p.label} — {aspectRatio(p.width, p.height)}</option>
            ))}
          </optgroup>
        ))}
        <optgroup label="Custom">
          <option value="__custom__">Custom size</option>
        </optgroup>
      </select>

      {isCustom && (
        <div className={styles.customSize}>
          <label>
            W
            <input
              type="number"
              value={custom.width}
              min={1}
              onChange={e => {
                const w = Math.max(1, Number(e.target.value))
                setCustom(p => ({ ...p, width: w }))
                settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: { ...custom, width: w } } })
              }}
            />
          </label>
          <span>×</span>
          <label>
            H
            <input
              type="number"
              value={custom.height}
              min={1}
              onChange={e => {
                const h = Math.max(1, Number(e.target.value))
                setCustom(p => ({ ...p, height: h }))
                settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: { ...custom, height: h } } })
              }}
            />
          </label>
          <span className={styles.ratio}>
            {custom.width && custom.height ? `(${(custom.width / custom.height).toFixed(2)}:1)` : ''}
          </span>
        </div>
      )}
    </section>
  )
}
