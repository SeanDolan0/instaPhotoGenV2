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

export default function MetadataPanel({ compact }: { compact?: boolean }) {
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

  function handleMoveUp(idx: number) {
    if (idx <= 0) return
    const fields = [...settings.metadataFields]
    const [moved] = fields.splice(idx, 1)
    fields.splice(idx - 1, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
  }

  function handleMoveDown(idx: number) {
    if (idx >= settings.metadataFields.length - 1) return
    const fields = [...settings.metadataFields]
    const [moved] = fields.splice(idx, 1)
    fields.splice(idx + 1, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
  }

  // --- Touch drag (HTML5 drag doesn't work on touch) ---
  // React registers onTouchMove as passive, so we use a native non-passive listener
  const touchRef = useRef<{ startIdx: number; startY: number; moved: boolean } | null>(null)
  const touchMoveFnRef = useRef<(e: TouchEvent) => void>(() => {})

  // Keep the handler function in a ref so the native listener always has the latest closure
  touchMoveFnRef.current = (e: TouchEvent) => {
    const t = touchRef.current
    if (!t) return
    if (!t.moved && Math.abs(e.touches[0].clientY - t.startY) < 6) return
    if (!t.moved) t.moved = true
    e.preventDefault()

    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
    const item = el?.closest<HTMLElement>('[data-meta-idx]')
    if (!item) return
    const overIdx = Number(item.dataset.metaIdx)
    if (isNaN(overIdx) || overIdx === t.startIdx) return

    setOverIdx(overIdx)
    const fields = [...settings.metadataFields]
    const [moved] = fields.splice(t.startIdx, 1)
    fields.splice(overIdx, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
    touchRef.current = { startIdx: overIdx, startY: t.startY, moved: true }
  }

  // Attach once — the ref swap above keeps it fresh
  useEffect(() => {
    const handler = (e: TouchEvent) => touchMoveFnRef.current(e)
    document.addEventListener('touchmove', handler, { passive: false })
    return () => document.removeEventListener('touchmove', handler)
  }, [])

  function handleTouchStart(e: React.TouchEvent, idx: number) {
    if ((e.target as HTMLElement).closest('button')) return
    touchRef.current = { startIdx: idx, startY: e.touches[0].clientY, moved: false }
    setDragIdx(idx)
  }

  function handleTouchEnd() {
    touchRef.current = null
    setDragIdx(null)
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

  function renderField(field: MetadataFieldConfig, idx: number, sideLabel: string) {
    return (
      <div
        key={field.key}
        data-meta-idx={idx}
        className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
        draggable
        onDragStart={() => handleDragStart(idx)}
        onDragOver={e => handleDragOver(e, idx)}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        onTouchStart={e => handleTouchStart(e, idx)}
        onTouchEnd={handleTouchEnd}
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
          <>
            <button
              className={styles.reorderBtn}
              onClick={() => handleMoveUp(idx)}
              title="Move up"
              aria-label="Move up"
            >▲</button>
            <button
              className={styles.reorderBtn}
              onClick={() => handleMoveDown(idx)}
              title="Move down"
              aria-label="Move down"
            >▼</button>
            <button
              className={styles.sideBtn}
              onClick={() => handleSideToggle(field.key)}
              title={`Move to ${sideLabel}`}
            >
              {sideLabel === 'right' ? '→' : '←'}
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <>
      {!compact && <h3 className={styles.sectionTitle}>Metadata Fields</h3>}
      <span className={styles.sideLabel}>Left</span>
      <div ref={listRef} className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'left')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'right'))}
      </div>

      <div className={styles.sectionDivider} />

      <span className={styles.sideLabel}>Right</span>
      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'right')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'left'))}
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
    </>
  )
}
