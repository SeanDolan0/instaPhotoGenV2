import { useEffect, useRef, useState, type DragEvent } from 'react'
import { useSettings } from '../../contexts/SettingsContext'
import type { AppSettings, MetadataFieldConfig } from '../../types'
import styles from '../../styles/ControlPanel.module.css'

function formatCoords(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S'
  const lngDir = lng >= 0 ? 'E' : 'W'
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`
}

function resolveLocationText(
  location: AppSettings['location'],
  imageId: string | undefined,
): string {
  const raw = imageId && location.perPhoto[imageId]
    ? location.perPhoto[imageId]
    : location.text
  if (!raw && location.lat === null) return ''
  switch (location.format) {
    case 'name': return raw
    case 'coordinates': return location.lat !== null ? formatCoords(location.lat, location.lng!) : ''
    case 'both': {
      const coords = location.lat !== null ? formatCoords(location.lat, location.lng!) : ''
      return [raw, coords].filter(Boolean).join('\n')
    }
  }
}

function composeText(
  fields: MetadataFieldConfig[],
  side: 'left' | 'right',
  metadata: Record<string, string>,
): string {
  const lines: string[] = []
  const currentLine: string[] = []

  for (const field of fields) {
    if (field.key.startsWith('__linebreak__')) {
      if (currentLine.length) {
        lines.push(currentLine.join(' '))
        currentLine.length = 0
      }
      continue
    }
    if (!field.enabled || field.side !== side) continue
    // Custom fields output their label as static text
    if (field.key.startsWith('__custom:')) {
      if (field.label) currentLine.push(field.label)
      continue
    }
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

  const editedLeft = useRef(false)
  const editedRight = useRef(false)

  const fieldsRef = useRef(settings.metadataFields)
  fieldsRef.current = settings.metadataFields

  const meta = (images[selectedImageIdx]?.metadata ?? {}) as Record<string, string>
  const composedLeft = composeText(settings.metadataFields, 'left', meta)
  const composedRight = composeText(settings.metadataFields, 'right', meta)

  const imageId = images[selectedImageIdx]?.id
  const locationText = resolveLocationText(settings.location, imageId)
  const locationSide = settings.location.side

  const leftText = editedLeft.current ? settings.metadataText : composedLeft
  const rightText = editedRight.current ? settings.metadataTextRight : composedRight

  useEffect(() => {
    if (!editedLeft.current) {
      const base = composedLeft
      const withLocation = locationSide === 'left' && locationText
        ? [base, locationText].filter(Boolean).join('\n')
        : base
      settingsDispatch({ type: 'SET_METADATA_TEXT', payload: withLocation })
    }
    if (!editedRight.current) {
      const base = composedRight
      const withLocation = locationSide === 'right' && locationText
        ? [base, locationText].filter(Boolean).join('\n')
        : base
      settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: withLocation })
    }
  }, [composedLeft, composedRight, locationText, locationSide])

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
  const isLinebreak = (key: string) => key.startsWith('__linebreak__')

  function renderField(field: MetadataFieldConfig, idx: number, sideLabel: string) {
    const custom = isCustom(field.key)
    const linebreak = isLinebreak(field.key)

    return (
      <div
        key={field.key}
        data-meta-idx={idx}
        className={`${styles.metaItem} ${dragIdx === idx ? styles.metaDragging : ''} ${overIdx === idx ? styles.metaOver : ''}`}
        draggable={!custom}
        onDragStart={() => handleDragStart(idx)}
        onDragOver={e => handleDragOver(e, idx)}
        onDragEnd={handleDragEnd}
        onDragLeave={handleDragLeave}
        onTouchStart={e => handleTouchStart(e, idx)}
        onTouchEnd={handleTouchEnd}
      >
        {linebreak ? (
          <span className={styles.lineBreak} />
        ) : custom ? (
          <label className={styles.metaLabel}>
            <input
              type="text"
              value={field.label}
              placeholder="Custom text..."
              onChange={e => settingsDispatch({ type: 'UPDATE_CUSTOM_FIELD', payload: { key: field.key, label: e.target.value } })}
              className={styles.brandInput}
              style={{ flex: 1, minWidth: 0, padding: '3px 6px', fontSize: '0.8rem' }}
            />
            <span className={styles.dragHandle}>⠿</span>
          </label>
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
            {!custom && (
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
              </>
            )}
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
      <span className={styles.sideLabel}>Left</span>
      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'left')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'right'))}
      </div>
      <button
        className={styles.reorderBtn}
        style={{ opacity: 1, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '4px 8px', marginTop: 4 }}
        onClick={() => settingsDispatch({ type: 'ADD_CUSTOM_FIELD', payload: { side: 'left' } })}
      >+ Add Line</button>

      <div className={styles.sectionDivider} />

      <span className={styles.sideLabel}>Right</span>
      <div className={styles.metaList}>
        {settings.metadataFields
          .filter(f => f.side === 'right')
          .map(field => renderField(field, settings.metadataFields.indexOf(field), 'left'))}
      </div>
      <button
        className={styles.reorderBtn}
        style={{ opacity: 1, alignSelf: 'flex-start', fontSize: '0.75rem', padding: '4px 8px', marginTop: 4 }}
        onClick={() => settingsDispatch({ type: 'ADD_CUSTOM_FIELD', payload: { side: 'right' } })}
      >+ Add Line</button>

      <textarea
        placeholder="Left text — auto-populates from EXIF. Edit freely."
        value={leftText}
        onChange={e => {
          editedLeft.current = true
          settingsDispatch({ type: 'SET_METADATA_TEXT', payload: e.target.value })
        }}
        rows={3}
      />
      <textarea
        placeholder="Right text — auto-populates from EXIF. Edit freely."
        value={rightText}
        onChange={e => {
          editedRight.current = true
          settingsDispatch({ type: 'SET_METADATA_TEXT_RIGHT', payload: e.target.value })
        }}
        rows={3}
      />
    </>
  )
}
