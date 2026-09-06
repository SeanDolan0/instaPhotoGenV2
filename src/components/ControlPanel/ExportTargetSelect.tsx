import { useEffect, useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { getTargetDimensions, presetsGrouped } from '../../lib/targets'
import styles from '../../styles/ControlPanel.module.css'

export default function ExportTargetSelect() {
  const { settings, settingsDispatch } = useSettings()
  const [custom, setCustom] = useState(
    settings.exportTarget.type === 'custom'
      ? settings.exportTarget.dimensions
      : { width: 1920, height: 1080 },
  )

  useEffect(() => {
    if (settings.exportTarget.type === 'custom') {
      setCustom(settings.exportTarget.dimensions)
    }
  }, [settings.exportTarget])

  const groups = presetsGrouped()
  const isCustom = settings.exportTarget.type === 'custom'
  const isMatchPhoto = settings.exportTarget.type === 'match-photo'

  function handleFlipOrientation() {
    if (settings.exportTarget.type === 'custom') {
      const flipped = { width: custom.height, height: custom.width }
      setCustom(flipped)
      settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: flipped } })
    } else if (settings.exportTarget.type === 'preset') {
      const dims = getTargetDimensions(settings.exportTarget)
      const flipped = { width: dims.height, height: dims.width }
      setCustom(flipped)
      settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: flipped } })
    }
  }

  const selectValue = isMatchPhoto
    ? '__match_photo__'
    : settings.exportTarget.type === 'preset'
      ? settings.exportTarget.key
      : '__custom__'

  return (
    <>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <select
          style={{ flex: 1 }}
          value={selectValue}
          onChange={e => {
            if (e.target.value === '__match_photo__') {
              settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'match-photo' } })
            } else if (e.target.value === '__custom__') {
              settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: custom } })
            } else {
              settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'preset', key: e.target.value } })
            }
          }}
        >
          <optgroup label="Auto / Original">
            <option value="__match_photo__">Match Photo (Original Ratio)</option>
          </optgroup>
          {Object.entries(groups).map(([group, presets]) => (
            <optgroup key={group} label={group}>
              {presets.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </optgroup>
          ))}
          <optgroup label="Custom">
            <option value="__custom__">Custom size</option>
          </optgroup>
        </select>
        {!isMatchPhoto && (
          <button
            type="button"
            className={styles.formatBtn}
            style={{ flex: '0 0 auto', padding: '6px 8px' }}
            onClick={handleFlipOrientation}
            title="Flip Orientation (⇄ Swap Width & Height)"
          >
            ⇄
          </button>
        )}
      </div>

      {isCustom && (
        <div className={styles.customSize}>
          <label>
            W
            <input
              type="number"
              value={custom.width}
              min={1}
              onChange={e => {
                const w = Math.max(1, Number(e.target.value) || 1)
                const updated = { ...custom, width: w }
                setCustom(updated)
                settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: updated } })
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
                const h = Math.max(1, Number(e.target.value) || 1)
                const updated = { ...custom, height: h }
                setCustom(updated)
                settingsDispatch({ type: 'SET_EXPORT_TARGET', payload: { type: 'custom', dimensions: updated } })
              }}
            />
          </label>
          <span className={styles.ratio}>
            {custom.width && custom.height ? `(${(custom.width / custom.height).toFixed(2)}:1)` : ''}
          </span>
        </div>
      )}
    </>)
}
