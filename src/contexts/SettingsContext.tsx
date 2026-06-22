import { createContext, useContext, useReducer, useState, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import type { AppSettings, ImageEntry } from '../types'

const DEFAULT_SETTINGS: AppSettings = {
  exportTarget: { type: 'preset', key: 'ig-portrait' },
  metadataFields: [
    { key: 'camera', label: 'Camera', enabled: false },
    { key: 'lens', label: 'Lens', enabled: false },
    { key: 'aperture', label: 'Aperture', enabled: true },
    { key: 'shutter', label: 'Shutter Speed', enabled: true },
    { key: 'iso', label: 'ISO', enabled: true },
    { key: 'focal', label: 'Focal Length', enabled: true },
    { key: '__linebreak__', label: '— Line Break —', enabled: true },
    { key: 'focal35', label: '35mm Equiv.', enabled: false },
    { key: 'ev', label: 'Exposure Comp.', enabled: false },
    { key: 'wb', label: 'White Balance', enabled: false },
    { key: 'metering', label: 'Metering Mode', enabled: false },
    { key: 'flash', label: 'Flash', enabled: false },
    { key: 'date', label: 'Date/Time', enabled: false },
  ],
  metadataOverrides: '',
  fontFamily: 'Inter',
  spacing: { textSize: 32, textOffsetY: 32, xInset: 32 },
  darkMode: false,
  branding: { enabled: false, text: '', position: 'bottom-right', logo: null },
}

type SettingsAction =
  | { type: 'SET_EXPORT_TARGET'; payload: AppSettings['exportTarget'] }
  | { type: 'TOGGLE_METADATA_FIELD'; payload: string }
  | { type: 'REORDER_METADATA_FIELDS'; payload: AppSettings['metadataFields'] }
  | { type: 'SET_METADATA_OVERRIDES'; payload: string }
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
    case 'SET_METADATA_OVERRIDES':
      return { ...state, metadataOverrides: action.payload }
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
  const [settings, settingsDispatch] = useReducer(settingsReducer, savedSettings)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

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
