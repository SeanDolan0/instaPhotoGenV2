export interface MetadataFieldConfig {
  key: string
  label: string
  enabled: boolean
  side: 'left' | 'right'
}

export interface ExportPresetEntry {
  key: string
  label: string
  group: string
  width: number
  height: number
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
}

export interface BrandingConfig {
  enabled: boolean
  text: string
  position: 'bottom-left' | 'bottom-right'
  logo: string | null
}

export interface AppSettings {
  exportTarget: ExportTarget
  metadataFields: MetadataFieldConfig[]
  metadataText: string
  metadataTextRight: string
  fontFamily: string
  spacing: SpacingConfig
  darkMode: boolean | 'system'
  branding: BrandingConfig
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
