import type { ExportTarget } from '../types'

export const EXPORT_PRESETS = [
  { key: 'ig-portrait', label: 'Post (Portrait)', group: 'Instagram', width: 1080, height: 1350 },
  { key: 'ig-square', label: 'Post (Square)', group: 'Instagram', width: 1080, height: 1080 },
  { key: 'ig-story', label: 'Story / Reel', group: 'Instagram', width: 1080, height: 1920 },
  { key: 'tt-post', label: 'Post', group: 'TikTok', width: 1080, height: 1920 },
  { key: 'fb-feed', label: 'Feed', group: 'Facebook', width: 1200, height: 630 },
  { key: 'fb-square', label: 'Square', group: 'Facebook', width: 1080, height: 1080 },
  { key: 'fb-story', label: 'Story', group: 'Facebook', width: 1080, height: 1920 },
  { key: 'li-post', label: 'Post', group: 'LinkedIn', width: 1200, height: 627 },
  { key: 'li-square', label: 'Square', group: 'LinkedIn', width: 1080, height: 1080 },
  { key: 'x-post', label: 'Post', group: 'X (Twitter)', width: 1600, height: 900 },
  { key: 'pin-pin', label: 'Pin', group: 'Pinterest', width: 1000, height: 1500 },
  { key: 'yt-thumb', label: 'Thumbnail', group: 'YouTube', width: 1280, height: 720 },
] as const

export function getTargetDimensions(target: ExportTarget): { width: number; height: number } {
  if (target.type === 'custom') return target.dimensions
  const preset = EXPORT_PRESETS.find(p => p.key === target.key)
  return preset ?? { width: 1080, height: 1350 }
}

export function getTargetLabel(target: ExportTarget): string {
  if (target.type === 'custom') return `${target.dimensions.width}×${target.dimensions.height}`
  const preset = EXPORT_PRESETS.find(p => p.key === target.key)
  return preset ? `${preset.group} — ${preset.label}` : 'Custom'
}

export function presetsGrouped(): Record<string, typeof EXPORT_PRESETS> {
  const groups: Record<string, typeof EXPORT_PRESETS> = {}
  for (const p of EXPORT_PRESETS) {
    if (!groups[p.group]) groups[p.group] = []
    groups[p.group].push(p as any)
  }
  return groups
}
