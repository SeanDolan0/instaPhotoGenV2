import { createContext, useCallback, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import type { AppSettings, ExportConfig, ImageEntry, MetadataFieldConfig } from '../types'

const STORAGE_KEY = 'ipg-settings'

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
  spacing: { textSize: 32, textOffsetY: 32, xInset: 32, photoScale: 100, textColor: '#0f172a', backgroundColor: '#ffffff', lineHeight: 1.3 },
  branding: { enabled: false, text: '', position: 'bottom-right', logoDataUrl: '', logoHeight: 40 },
  exportConfig: { format: 'png', jpegQuality: 92 },
  carouselSlides: 0,
  location: { text: '', format: 'name', lat: null, lng: null, side: 'left', perPhoto: {} },
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as AppSettings
    // Migrate: strip legacy __linebreak_right__, ensure `side` on all fields, add new defaults
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      metadataFields: parsed.metadataFields
        .filter((f: MetadataFieldConfig) => f.key !== '__linebreak_right__')
        .map((f: MetadataFieldConfig) => ({ ...f, side: f.side || 'left' })),
      spacing: { ...DEFAULT_SETTINGS.spacing, ...parsed.spacing },
      branding: { ...DEFAULT_SETTINGS.branding, ...parsed.branding },
      exportConfig: { ...DEFAULT_SETTINGS.exportConfig, ...parsed.exportConfig },
      carouselSlides: parsed.carouselSlides ?? 0,
      location: { ...DEFAULT_SETTINGS.location, ...parsed.location },
    }
  } catch {
    return DEFAULT_SETTINGS
  }
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
  | { type: 'SET_EXPORT_CONFIG'; payload: Partial<ExportConfig> }
  | { type: 'ADD_CUSTOM_FIELD'; payload: { side: 'left' | 'right' } }
  | { type: 'UPDATE_CUSTOM_FIELD'; payload: { key: string; label: string } }
  | { type: 'REMOVE_CUSTOM_FIELD'; payload: string }
  | { type: 'LOAD_PRESET'; payload: AppSettings }
  | { type: 'SET_CAROUSEL_SLIDES'; payload: number }
  | { type: 'SET_LOCATION_TEXT'; payload: string }
  | { type: 'SET_LOCATION_FORMAT'; payload: 'name' | 'coordinates' | 'both' }
  | { type: 'SET_LOCATION_COORDS'; payload: { lat: number; lng: number } }
  | { type: 'SET_LOCATION_SIDE'; payload: 'left' | 'right' }
  | { type: 'SET_LOCATION_PER_PHOTO'; payload: { imageId: string; text: string } }
  | { type: 'CLEAR_LOCATION_PER_PHOTO'; payload: string }

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
    case 'SET_EXPORT_CONFIG':
      return { ...state, exportConfig: { ...state.exportConfig, ...action.payload } }
    case 'ADD_CUSTOM_FIELD': {
      const id = `__custom:${Date.now()}`
      const newField: MetadataFieldConfig = { key: id, label: '', enabled: true, side: action.payload.side }
      return { ...state, metadataFields: [...state.metadataFields, newField] }
    }
    case 'UPDATE_CUSTOM_FIELD':
      return {
        ...state,
        metadataFields: state.metadataFields.map(f =>
          f.key === action.payload.key ? { ...f, label: action.payload.label } : f
        ),
      }
    case 'REMOVE_CUSTOM_FIELD':
      return {
        ...state,
        metadataFields: state.metadataFields.filter(f => f.key !== action.payload),
      }
    case 'LOAD_PRESET':
      return { ...action.payload }
    case 'SET_CAROUSEL_SLIDES':
      return { ...state, carouselSlides: action.payload }
    case 'SET_LOCATION_TEXT':
      return { ...state, location: { ...state.location, text: action.payload } }
    case 'SET_LOCATION_FORMAT':
      return { ...state, location: { ...state.location, format: action.payload } }
    case 'SET_LOCATION_COORDS':
      return { ...state, location: { ...state.location, lat: action.payload.lat, lng: action.payload.lng } }
    case 'SET_LOCATION_SIDE':
      return { ...state, location: { ...state.location, side: action.payload } }
    case 'SET_LOCATION_PER_PHOTO':
      return {
        ...state,
        location: {
          ...state.location,
          perPhoto: { ...state.location.perPhoto, [action.payload.imageId]: action.payload.text },
        },
      }
    case 'CLEAR_LOCATION_PER_PHOTO': {
      const { [action.payload]: _, ...rest } = state.location.perPhoto
      return { ...state, location: { ...state.location, perPhoto: rest } }
    }
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
  const [settings, settingsDispatch] = useReducer(settingsReducer, undefined, loadSettings)
  const [images, setImages] = useState<ImageEntry[]>([])
  const [selectedImageIdx, setSelectedImageIdx] = useState(0)

  // Persist settings to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch { /* quota exceeded */ }
  }, [settings])

  // Clamp selectedImageIdx when images shrink
  useEffect(() => {
    setSelectedImageIdx(prev => Math.min(prev, Math.max(0, images.length - 1)))
  }, [images.length])

  const addImages = useCallback((entries: ImageEntry[]) => {
    setImages(prev => [...prev, ...entries])
    settingsDispatch({ type: 'SET_CAROUSEL_SLIDES', payload: 0 })
  }, [])

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }, [])

  const clearImages = useCallback(() => {
    setImages([])
    setSelectedImageIdx(0)
  }, [])

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
