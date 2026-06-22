import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import type { MetadataFieldConfig } from '../../types'
import styles from '../../styles/ControlPanel.module.css'

function composeText(
  fields: MetadataFieldConfig[],
  side: 'left' | 'right',
  metadata: Record<string, string>,
): string {
  const lines: string[] = []
  const currentLine: string[] = []

  for (const field of fields) {
    if (field.key.startsWith('__linebreak__')) {
      // linebreak applies to both left and right text
      if (currentLine.length) {
        lines.push(currentLine.join(' '))
        currentLine.length = 0
      }
      continue
    }
    if (!field.enabled || field.side !== side) continue
    const val = metadata[field.key]
    if (val) currentLine.push(val)
  }
  if (currentLine.length) lines.push(currentLine.join(' '))

  return lines.join('\n')
}

export default function MetadataPanel() {
  const { settings, settingsDispatch, images, selectedImageIdx } = useSettings()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Auto-compose metadata text from enabled fields split by side
  useEffect(() => {
    const meta = images[selectedImageIdx]?.metadata ?? ({} as Record<string, string>)
    const vals = meta as Record<string, string>

    const leftText = composeText(settings.metadataFields, 'left', vals)
    const rightText = composeText(settings.metadataFields, 'right', vals)

    settingsDispatch({ type: 'SET_METADATA_TEXT', payload: leftText })
    settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: rightText })
  }, [settings.metadataFields, images, selectedImageIdx])

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

  function handleDragLeave() {
    setOverIdx(null)
  }

  function handleSideToggle(key: string) {
    const field = settings.metadataFields.find(f => f.key === key)
    if (!field) return
    settingsDispatch({
      type: 'SET_METADATA_SIDE',
      payload: { key, side: field.side === 'left' ? 'right' : 'left' },
    })
  }

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Metadata Fields</h3>
      <div ref={listRef} className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'left')
          .map(field => {
            const idx = settings.metadataFields.indexOf(field)
            return (
              <div
                key={field.key}
                className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
              >
                {field.key.startsWith('__linebreak__') ? (
                  <span className={styles.lineBreak} />
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
                {!field.key.startsWith('__linebreak__') && (
                  <button
                    className={styles.sideBtn}
                    onClick={() => handleSideToggle(field.key)}
                    title="Move to right side"
                  >
                    →
                  </button>
                )}
              </div>
            )
          })}
      </div>

      <div className={styles.sectionDivider} />

      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'right')
          .map(field => {
            const idx = settings.metadataFields.indexOf(field)
            return (
              <div
                key={field.key}
                className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                onDragLeave={handleDragLeave}
              >
                {field.key.startsWith('__linebreak__') ? (
                  <span className={styles.lineBreak} />
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
                {!field.key.startsWith('__linebreak__') && (
                  <button
                    className={styles.sideBtn}
                    onClick={() => handleSideToggle(field.key)}
                    title="Move to left side"
                  >
                    ←
                  </button>
                )}
              </div>
            )
          })}
      </div>

      <textarea
        placeholder="Left text — auto-populates from EXIF. Edit freely."
        value={settings.metadataText}
        onChange={e => settingsDispatch({ type: 'SET_METADATA_TEXT', payload: e.target.value })}
        rows={3}
      />
      <textarea
        placeholder="Right text — auto-populates from EXIF. Edit freely."
        value={settings.metadataTextRight}
        onChange={e => settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: e.target.value })}
        rows={3}
      />
    </section>
  )
}
