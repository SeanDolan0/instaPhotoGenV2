export interface MetadataFieldConfig {
  key: string
  label: string
  enabled: boolean
  side: 'left' | 'right'
}

export type ExportTarget =
  | { type: 'preset'; key: string }
  | { type: 'custom'; dimensions: { width: number; height: number } }

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
}

export interface ImageEntry {
  id: string
  file: File
  img: HTMLImageElement
  metadata: Partial<NormalizedMetadata>
}
