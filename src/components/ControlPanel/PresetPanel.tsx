import { useState } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import type { AppSettings } from '../../types'
import styles from '../../styles/ControlPanel.module.css'

interface NamedPreset {
  name: string
  settings: AppSettings
}

const PRESETS_KEY = 'ipg-presets'

export default function PresetPanel() {
  const { settings, settingsDispatch } = useSettings()
  const [presets, setPresets] = useLocalStorage<NamedPreset[]>(PRESETS_KEY, [])
  const [newName, setNewName] = useState('')

  function handleSave() {
    const name = newName.trim()
    if (!name) return
    setPresets(prev => [...prev.filter(p => p.name !== name), { name, settings: structuredClone(settings) }])
    setNewName('')
  }

  function handleLoad(preset: NamedPreset) {
    settingsDispatch({ type: 'LOAD_PRESET', payload: structuredClone(preset.settings) })
  }

  function handleDelete(name: string) {
    setPresets(prev => prev.filter(p => p.name !== name))
  }

  return (
    <div className={styles.brandFields}>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Preset name..."
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          className={styles.brandInput}
          style={{ flex: 1 }}
        />
        <button
          className={styles.exportBtn}
          style={{ width: 'auto', padding: '8px 12px', margin: 0 }}
          onClick={handleSave}
          disabled={!newName.trim()}
        >
          Save
        </button>
      </div>

      {presets.length === 0 && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>
          No saved presets yet
        </p>
      )}

      {presets.map(preset => (
        <div key={preset.name} className={styles.fieldRow}>
          <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preset.name}
          </span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              className={styles.reorderBtn}
              style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
              onClick={() => handleLoad(preset)}
            >
              Load
            </button>
            <button
              className={styles.reorderBtn}
              style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px', color: '#c87070' }}
              onClick={() => handleDelete(preset.name)}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
