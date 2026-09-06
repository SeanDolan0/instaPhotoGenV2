import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import type { MetadataFieldConfig } from '../../types'
import { setManualEdit, useMetadataText } from '../../hooks/useMetadataText'
import styles from '../../styles/ControlPanel.module.css'

export default function MetadataPanel() {
  const { settings, settingsDispatch, images, selectedImageIdx } = useSettings()
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)
  const [showDateConfig, setShowDateConfig] = useState(false)

  const activeImageId = images[selectedImageIdx]?.id
  const { isLeftEdited, isRightEdited, resetLeft, resetRight } = useMetadataText()

  const fieldsRef = useRef(settings.metadataFields)
  fieldsRef.current = settings.metadataFields

  function handleDragStart(e: DragEvent, idx: number) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
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

  function handleMoveUp(key: string, side: 'left' | 'right') {
    const sideFields = settings.metadataFields.filter(f => f.side === side)
    const sideIdx = sideFields.findIndex(f => f.key === key)
    if (sideIdx <= 0) return

    const prevField = sideFields[sideIdx - 1]
    const fields = [...settings.metadataFields]
    const currentGlobalIdx = fields.findIndex(f => f.key === key)
    const prevGlobalIdx = fields.findIndex(f => f.key === prevField.key)

    const [moved] = fields.splice(currentGlobalIdx, 1)
    fields.splice(prevGlobalIdx, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
  }

  function handleMoveDown(key: string, side: 'left' | 'right') {
    const sideFields = settings.metadataFields.filter(f => f.side === side)
    const sideIdx = sideFields.findIndex(f => f.key === key)
    if (sideIdx < 0 || sideIdx >= sideFields.length - 1) return

    const nextField = sideFields[sideIdx + 1]
    const fields = [...settings.metadataFields]
    const currentGlobalIdx = fields.findIndex(f => f.key === key)
    const nextGlobalIdx = fields.findIndex(f => f.key === nextField.key)

    const [moved] = fields.splice(currentGlobalIdx, 1)
    fields.splice(nextGlobalIdx, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: fields })
  }

  const longPressMs = 100
  const scrollCancelPx = 10
  const touchRef = useRef<{
    startIdx: number
    startY: number
    dragging: boolean
  } | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const touchMoveFnRef = useRef<(e: TouchEvent) => void>(() => {})

  touchMoveFnRef.current = (e: TouchEvent) => {
    const t = touchRef.current
    if (!t) return

    if (!t.dragging) {
      if (Math.abs(e.touches[0].clientY - t.startY) > scrollCancelPx) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current)
          longPressTimer.current = null
        }
        touchRef.current = null
      }
      return
    }

    e.preventDefault()

    const el = document.elementFromPoint(e.touches[0].clientX, e.touches[0].clientY)
    const item = el?.closest<HTMLElement>('[data-meta-idx]')
    if (!item) return
    const over = Number(item.dataset.metaIdx)
    if (isNaN(over) || over === t.startIdx) return

    setOverIdx(over)
    const currentFields = [...fieldsRef.current]
    const [moved] = currentFields.splice(t.startIdx, 1)
    currentFields.splice(over, 0, moved)
    settingsDispatch({ type: 'REORDER_METADATA_FIELDS', payload: currentFields })
    touchRef.current = { startIdx: over, startY: t.startY, dragging: true }
  }

  useEffect(() => {
    const handler = (e: TouchEvent) => touchMoveFnRef.current(e)
    document.addEventListener('touchmove', handler, { passive: false })
    return () => document.removeEventListener('touchmove', handler)
  }, [])

  function handleTouchStart(e: React.TouchEvent, idx: number) {
    if ((e.target as HTMLElement).closest('button, input')) return

    touchRef.current = { startIdx: idx, startY: e.touches[0].clientY, dragging: false }

    longPressTimer.current = setTimeout(() => {
      longPressTimer.current = null
      if (!touchRef.current || touchRef.current.dragging) return
      touchRef.current = { ...touchRef.current, dragging: true }
      setDragIdx(idx)
    }, longPressMs)
  }

  function handleTouchEnd() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
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

  const isCustom = (key: string) => key.startsWith('__custom:')
  const isLinebreak = (key: string) => key.startsWith('__linebreak')

  function renderField(field: MetadataFieldConfig, idx: number, sideLabel: string) {
    const custom = isCustom(field.key)
    const linebreak = isLinebreak(field.key)

    return (
      <div key={field.key}>
        <div
          data-meta-idx={idx}
          className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
        draggable
        onDragStart={e => handleDragStart(e, idx)}
        onDragOver={e => handleDragOver(e, idx)}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        onTouchStart={e => handleTouchStart(e, idx)}
        onTouchEnd={handleTouchEnd}
      >
        {linebreak ? (
          <div className={styles.lineBreakItem} style={{ flex: 1 }}>
            <span className={styles.dragHandle}>⠿</span>
            <span style={{ flex: 1 }}>— Line Break —</span>
            <button
              className={styles.reorderBtn}
              style={{ opacity: 1, color: '#c87070' }}
              onClick={() => settingsDispatch({ type: 'REMOVE_LINEBREAK', payload: field.key })}
              title="Remove break"
              aria-label="Remove line break"
            >×</button>
            <button
              className={styles.reorderBtn}
              style={{ opacity: 1 }}
              onClick={() => handleMoveUp(field.key, field.side)}
              title="Move up"
              aria-label="Move up"
            >▲</button>
            <button
              className={styles.reorderBtn}
              style={{ opacity: 1 }}
              onClick={() => handleMoveDown(field.key, field.side)}
              title="Move down"
              aria-label="Move down"
            >▼</button>
            <button
              className={styles.sideBtn}
              style={{ opacity: 1 }}
              onClick={() => handleSideToggle(field.key)}
              title={`Move to ${sideLabel}`}
            >
              {sideLabel === 'right' ? '→' : '←'}
            </button>
          </div>
        ) : custom ? (
          <label className={styles.metaLabel} style={{ flex: 1 }}>
            <span className={styles.dragHandle}>⠿</span>
            <input
              type="text"
              value={field.label}
              placeholder="Custom text..."
              onChange={e => settingsDispatch({ type: 'UPDATE_CUSTOM_FIELD', payload: { key: field.key, label: e.target.value } })}
              className={styles.brandInput}
              style={{ flex: 1, minWidth: 0, padding: '3px 6px', fontSize: '0.8rem' }}
            />
          </label>
        ) : (
          <label className={styles.metaLabel} style={{ flex: 1 }}>
            <input
              type="checkbox"
              checked={field.enabled}
              onChange={() => settingsDispatch({ type: 'TOGGLE_METADATA_FIELD', payload: field.key })}
            />
            <span style={{ flex: 1 }}>{field.label}</span>
            {field.key === 'date' && (
              <button
                type="button"
                className={styles.gearBtn}
                onClick={e => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowDateConfig(prev => !prev)
                }}
                title="Date & Time settings"
                aria-label="Date and time settings"
              >
                ⚙
              </button>
            )}
            <span className={styles.dragHandle}>⠿</span>
          </label>
        )}
        {!linebreak && (
          <>
            {custom && (
              <button
                className={styles.reorderBtn}
                style={{ opacity: 1, color: '#c87070' }}
                onClick={() => settingsDispatch({ type: 'REMOVE_CUSTOM_FIELD', payload: field.key })}
                title="Remove"
                aria-label="Remove custom field"
              >×</button>
            )}
            <button
              className={styles.reorderBtn}
              onClick={() => handleMoveUp(field.key, field.side)}
              title="Move up"
              aria-label="Move up"
            >▲</button>
            <button
              className={styles.reorderBtn}
              onClick={() => handleMoveDown(field.key, field.side)}
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
      {field.key === 'date' && showDateConfig && (
        <div className={styles.dateConfigDrawer}>
          <div className={styles.dateConfigRow}>
            <span>Date Format</span>
            <select
              value={settings.dateTime?.dateFormat ?? 'YYYY-MM-DD'}
              onChange={e => settingsDispatch({
                type: 'SET_DATE_TIME',
                payload: { dateFormat: e.target.value as any }
              })}
            >
              <option value="YYYY-MM-DD">YYYY-MM-DD (2024-03-24)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (03/24/2024)</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY (24/03/2024)</option>
              <option value="MMM D, YYYY">MMM D, YYYY (Mar 24, 2024)</option>
              <option value="D MMM YYYY">D MMM YYYY (24 Mar 2024)</option>
              <option value="none">None (Time only)</option>
            </select>
          </div>
          <div className={styles.dateConfigRow}>
            <span>Time Format</span>
            <select
              value={settings.dateTime?.timeFormat ?? '24h'}
              onChange={e => settingsDispatch({
                type: 'SET_DATE_TIME',
                payload: { timeFormat: e.target.value as any }
              })}
            >
              <option value="24h">24-Hour (14:30)</option>
              <option value="12h">12-Hour (2:30 PM)</option>
              <option value="12h-no-am">12-Hour no AM/PM (2:30)</option>
              <option value="none">None (Date only)</option>
            </select>
          </div>
          <div className={styles.dateConfigRow}>
            <span>Separator</span>
            <select
              value={settings.dateTime?.separator ?? ' '}
              onChange={e => settingsDispatch({
                type: 'SET_DATE_TIME',
                payload: { separator: e.target.value as any }
              })}
            >
              <option value=" ">Space (" ")</option>
              <option value=" • ">Bullet (" • ")</option>
              <option value=" at ">At (" at ")</option>
              <option value=" - ">Dash (" - ")</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
  }

  return (
    <>
      <span className={styles.sideLabel}>Left</span>
      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'left')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'right'))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          className={styles.reorderBtn}
          style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={() => settingsDispatch({ type: 'ADD_CUSTOM_FIELD', payload: { side: 'left' } })}
        >+ Add Line</button>
        <button
          className={styles.reorderBtn}
          style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={() => settingsDispatch({ type: 'ADD_LINEBREAK', payload: { side: 'left' } })}
        >+ Add Break</button>
      </div>

      <div className={styles.sectionDivider} />

      <span className={styles.sideLabel}>Right</span>
      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'right')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'left'))}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
        <button
          className={styles.reorderBtn}
          style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={() => settingsDispatch({ type: 'ADD_CUSTOM_FIELD', payload: { side: 'right' } })}
        >+ Add Line</button>
        <button
          className={styles.reorderBtn}
          style={{ opacity: 1, fontSize: '0.75rem', padding: '4px 8px' }}
          onClick={() => settingsDispatch({ type: 'ADD_LINEBREAK', payload: { side: 'right' } })}
        >+ Add Break</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 2 }}>
        <span className={styles.sideLabel}>Left Text</span>
        {isLeftEdited && (
          <button className={styles.resetBtn} onClick={resetLeft} title="Reset to auto-generated EXIF">
            Reset to EXIF
          </button>
        )}
      </div>
      <textarea
        placeholder="Left text — auto-populates from EXIF. Edit freely."
        value={settings.metadataText}
        onChange={e => {
          if (activeImageId) setManualEdit(activeImageId, 'left', e.target.value)
          settingsDispatch({ type: 'SET_METADATA_TEXT', payload: e.target.value })
        }}
        rows={3}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 2 }}>
        <span className={styles.sideLabel}>Right Text</span>
        {isRightEdited && (
          <button className={styles.resetBtn} onClick={resetRight} title="Reset to auto-generated EXIF">
            Reset to EXIF
          </button>
        )}
      </div>
      <textarea
        placeholder="Right text — auto-populates from EXIF. Edit freely."
        value={settings.metadataTextRight}
        onChange={e => {
          if (activeImageId) setManualEdit(activeImageId, 'right', e.target.value)
          settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: e.target.value })
        }}
        rows={3}
      />
    </>
  )
}
