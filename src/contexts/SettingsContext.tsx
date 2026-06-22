import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { AppSettings, ImageEntry, MetadataFieldConfig } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  exportTarget: { type: 'preset', key: 'ig-portrait' },
  metadataFields: [
    { key: 'camera', label: 'Camera', enabled: false, side: 'left' },
    { key: 'lens', label: 'Lens', enabled: false, side: 'left' },
    { key: 'aperture', label: 'Aperture', enabled: true, side: 'left' },
    { key: 'shutter', label: 'Shutter Speed', enabled: true, side: 'left' },
    { key: 'iso', label: 'ISO', enabled: true, side: 'left' },
    { key: 'focal', label: 'Focal Length', enabled: true, side: 'left' },
    { key: '__linebreak__', label: '— Line Break —', enabled: true, side: 'left' },
    { key: 'focal35', label: '35mm Equiv.', enabled: false, side: 'left' },
    { key: 'ev', label: 'Exposure Comp.', enabled: false, side: 'left' },
    { key: 'wb', label: 'White Balance', enabled: false, side: 'left' },
    { key: 'metering', label: 'Metering Mode', enabled: false, side: 'left' },
    { key: 'flash', label: 'Flash', enabled: false, side: 'left' },
    { key: 'date', label: 'Date/Time', enabled: false, side: 'left' },
  ],
  metadataText: '',
  metadataTextRight: '',
  fontFamily: 'Inter',
  spacing: { textSize: 32, textOffsetY: 32, xInset: 32, photoScale: 100, textColor: '#0f172a' },
  darkMode: false,
  branding: { enabled: false, text: '', position: 'bottom-right', logo: null },
}

type SettingsAction =
  | { type: 'SET_EXPORT_TARGET'; payload: AppSettings['exportTarget'] }
  | { type: 'TOGGLE_METADATA_FIELD'; payload: string }
  | { type: 'REORDER_METADATA_FIELDS'; payload: AppSettings['metadataFields'] }
  | { type: 'SET_METADATA_SIDE'; payload: { key: string; side: 'left' | 'right' } }
  | { type: 'SET_METADATA_TEXT'; payload: string }
  | { type: 'SET_METADATA_TEXT_RIGHT'; payload: string }
  | { type: 'SET_FONT'; payload: string }
  | { type: 'SET_SPACING'; payload: Partial<AppSettings['spacing']> }
  | { type: 'SET_BRANDING'; payload: Partial<AppSettings['branding']> }

function settingsReducer(state: AppSettings, action: SettingsAction): AppSettings {
  switch (action.type) {
    case 'SET_EXPORT_TARGET':
      return { ...state, exportTarget: action.payload }
    case 'TOGGLE_METADATA_FIELD':
      return {
        ...state,
        metadataFields: state.metadataFields.map(f =>
          f.key === action.payload ? { ...f, enabled: !f.enabled } : f
        ),
      }
    case 'REORDER_METADATA_FIELDS':
      return { ...state, metadataFields: action.payload }
    case 'SET_METADATA_SIDE':
      return {
        ...state,
        metadataFields: state.metadataFields.map(f =>
          f.key === action.payload.key ? { ...f, side: action.payload.side } : f
        ),
      }
    case 'SET_METADATA_TEXT':
      return { ...state, metadataText: action.payload }
    case 'SET_METADATA_TEXT_RIGHT':
      return { ...state, metadataTextRight: action.payload }
    case 'SET_FONT':
      return { ...state, fontFamily: action.payload }
    case 'SET_SPACING':
      return { ...state, spacing: { ...state.spacing, ...action.payload } }
    case 'SET_BRANDING':
      return { ...state, branding: { ...state.branding, ...action.payload } }
    default:
      return state
  }
}

interface SettingsContextValue {
  settings: AppSettings
  settingsDispatch: React.Dispatch<SettingsAction>
  images: ImageEntry[]
  addImages: (entries: ImageEntry[]) => void
  removeImage: (id: string) => void
  clearImages: () => void
  selectedImageIdx: number
  setSelectedImageIdx: (idx: number) => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [savedSettings] = useLocalStorage('ipg-settings', DEFAULT_SETTINGS)
  // Migrate old settings that lack `side` on metadata fields, and strip old __linebreak_right__
  const migrated = {
    ...savedSettings,
    metadataFields: savedSettings.metadataFields
      .filter(f => f.key !== '__linebreak_right__')
      .map(f => ({ ...f, side: (f as MetadataFieldConfig).side || 'left' })),
  }
  const [settings, settingsDispatch] = useReducer(settingsReducer, migrated)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

  // Clamp selectedImageIdx when images shrink (e.g. after removal)
  useEffect(() => {
    setSelectedImageIdx(prev => Math.min(prev, Math.max(0, images.length - 1)))
  }, [images.length])

  // Sync settings changes to localStorage after each dispatch
  const prevRef = { current: settings }
  prevRef.current = settings
  const synced = useLocalStorage('ipg-settings', DEFAULT_SETTINGS)
  // We sync by writing on each render via the settings state
  if (synced[0] !== settings) {
    synced[1](settings)
  }

  const addImages = (entries: ImageEntry[]) => {
    setImages(prev => [...prev, ...entries])
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const clearImages = () => {
    setImages([])
    setSelectedImageIdx(0)
  }

  return (
    <SettingsContext.Provider value={{
      settings,
      settingsDispatch,
      images,
      addImages,
      removeImage,
      clearImages,
      selectedImageIdx,
      setSelectedImageIdx,
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
