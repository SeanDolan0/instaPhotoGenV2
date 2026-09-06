export interface MetadataFieldConfig {
  key: string
  label: string
  enabled: boolean
  side: 'left' | 'right'
}

export type ExportTarget =
  | { type: 'preset'; key: string }
  | { type: 'custom'; dimensions: { width: number; height: number } }
  | { type: 'match-photo' }

export interface SpacingConfig {
  textSize: number
  textOffsetY: number
  xInset: number
  photoScale: number
  textColor: string
  backgroundColor: string
  lineHeight: number
}

export interface BrandingConfig {
  enabled: boolean
  text: string
  position: 'bottom-left' | 'bottom-right'
  logoDataUrl: string
  logoHeight: number
}

export interface DateTimeConfig {
  dateFormat: 'YYYY-MM-DD' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'MMM D, YYYY' | 'D MMM YYYY' | 'none'
  timeFormat: '24h' | '12h' | '12h-no-am' | 'none'
  separator: ' ' | ' • ' | ' at ' | ' - '
  customFormat?: string
}

export interface LocationConfig {
  text: string
  format: 'name' | 'coordinates' | 'both'
  lat: number | null
  lng: number | null
  side: 'left' | 'right'
  perPhoto: Record<string, string>
}

export interface ExportConfig {
  format: 'png' | 'jpeg'
  jpegQuality: number
}

export interface AppSettings {
  exportTarget: ExportTarget
  exportConfig: ExportConfig
  metadataFields: MetadataFieldConfig[]
  metadataText: string
  metadataTextRight: string
  fontFamily: string
  spacing: SpacingConfig
  branding: BrandingConfig
  carouselSlides: number // 0 = off, 2-5 = N slides
  location: LocationConfig
  dateTime: DateTimeConfig
}

export interface NormalizedMetadata {
  camera: string
  lens: string
  aperture: string
  shutter: string
  iso: string
  focal: string
  focal35: string
  ev: string
  wb: string
  metering: string
  flash: string
  date: string
  rawDate?: string
  gps?: { lat: number; lng: number }
}

export interface ImageEntry {
  id: string
  file: File
  img: HTMLImageElement
  metadata: Partial<NormalizedMetadata>
  carouselSlides: number
  thumbnailUrl?: string
}
