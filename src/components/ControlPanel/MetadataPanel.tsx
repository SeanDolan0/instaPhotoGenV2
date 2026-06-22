import { useRef, useState, type DragEvent } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import type { MetadataFieldConfig } from '../../types'
import styles from '../../styles/ControlPanel.module.css'

export default function MetadataPanel() {
  const { settings, settingsDispatch } = useSettings()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  function handleDragStart(idx: number) {
    setDragIdx(idx)
  }

  function handleDragOver(e: DragEvent, idx: number) {
    e.preventDefault()
    setOverIdx(idx)
    if (dragIdx === null || dragIdx === idx) return

    const fields = [...settings.metadataFields]
    const [moved] = fields.splice(dragIdx, 1)
    fields.splice(idx, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
    setDragIdx(idx)
  }

  function handleDragEnd() {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Metadata Fields</h3>
      <div ref={listRef} className={styles.metaList}>
        {settings.metadataFields.map((field: MetadataFieldConfig, idx: number) => (
          <div
            key={field.key}
            className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragOver={e => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            onDragLeave={() => setOverIdx(null)}
          >
            {field.key === '__linebreak__' ? (
              <span className={styles.lineBreak}>— Line Break —</span>
            ) : (
              <label className={styles.metaLabel}>
                <input
                  type="checkbox"
                  checked={field.enabled}
                  onChange={() => settingsDispatch({ type: 'TOGGLE_METADATA_FIELD', payload: field.key })}
                />
                <span>{field.label}</span>
                <span className={styles.dragHandle}>⠿</span>
              </label>
            )}
          </div>
        ))}
      </div>
      <textarea
        placeholder="Additional notes or overrides..."
        value={settings.metadataOverrides}
        onChange={e => settingsDispatch({ type: 'SET_METADATA_OVERRIDES', payload: e.target.value })}
        rows={3}
      />
    </section>
  )
}
