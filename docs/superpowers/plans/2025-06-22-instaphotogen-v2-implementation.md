# InstaPhotoGen V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure client-side React SPA that transforms raw images into social-media-ready exports with EXIF metadata overlays, supporting multiple export targets, batch processing, dark mode, and persistent settings.

**Architecture:** Single-page React 18 + Vite 5 + TypeScript app. No backend. EXIF extraction via `exifr`, canvas rendering via native Canvas API, batch export via `jszip`. State via React Context + useReducer, persisted to localStorage.

**Tech Stack:** React 18, Vite 5, TypeScript, exifr, jszip, CSS Modules + CSS custom properties.

## Global Constraints

- Pure client-side — no backend, no API calls, no database
- All image processing via native Canvas API (no image processing libraries)
- Deterministic rendering: same inputs → same pixel output
- Non-destructive image handling: never crop or distort images
- GitHub Pages deployment: Vite `base: './'` for relative asset paths
- TypeScript strict mode enabled
- Maximum 2 runtime dependencies (exifr, jszip)
- Dark mode respects `prefers-color-scheme` if no saved preference
- All settings persisted to localStorage under `ipg-` prefix key

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/vite-env.d.ts`
- Create: `.gitignore`

**Interfaces:**
- Consumes: nothing
- Produces: working Vite dev server at `npm run dev`, production build at `npm run build`

- [ ] **Step 1: Initialize project**

```bash
cd /c/Users/sedol/Documents/instaPhotoGenV2
npm create vite@latest . -- --template react-ts
```

Answer "yes" to install in existing directory.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install exifr jszip
```

- [ ] **Step 3: Install dev dependency for GH Pages deploy**

```bash
npm install --save-dev gh-pages
```

- [ ] **Step 4: Configure Vite for GitHub Pages**

Replace contents of `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
})
```

- [ ] **Step 5: Add deploy scripts to package.json**

Edit `package.json` to add:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "deploy": "npx gh-pages -d dist"
}
```

- [ ] **Step 6: Create .gitignore**

```
node_modules
dist
*.local
```

- [ ] **Step 7: Replace index.html root template**

Replace the auto-generated `index.html` with:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InstaPhotoGen</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create src/vite-env.d.ts**

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 9: Create src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 10: Verify the scaffold builds**

```bash
npm run build
```

Expected output: Build succeeds, `dist/` directory created with `index.html` + `assets/`.

- [ ] **Step 11: Commit**

```bash
git init
git add -A
git commit -m "feat: scaffold Vite + React + TypeScript project"
```

---

### Task 2: Core Types + Export Target Presets

**Files:**
- Create: `src/types.ts`
- Create: `src/lib/targets.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `ExportTarget`, `ExportPreset`, `MetadataFieldConfig`, `BrandingConfig`, `SpacingConfig`, `StylingConfig`, `AppSettings` types; `EXPORT_PRESETS` constant; `getTargetDimensions()` function

- [ ] **Step 1: Create src/types.ts**

```ts
export interface ExportPreset {
  label: string
  group: string
  width: number
  height: number
}

export interface CustomTarget {
  width: number
  height: number
}

export type ExportTarget =
  | { type: 'preset'; key: string }
  | { type: 'custom'; dimensions: CustomTarget }

export interface MetadataFieldConfig {
  key: string
  label: string
  enabled: boolean
}

export interface BrandingConfig {
  enabled: boolean
  text: string
  position: 'bottom-left' | 'bottom-right'
  logo: string | null // base64 data URL
}

export interface SpacingConfig {
  textSize: number
  textOffsetY: number
  xInset: number
}

export interface StylingConfig {
  fontFamily: string
  spacing: SpacingConfig
}

export interface AppSettings {
  exportTarget: ExportTarget
  metadataFields: MetadataFieldConfig[]
  metadataOverrides: string
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
  metadata: NormalizedMetadata
}
```

- [ ] **Step 2: Create src/lib/targets.ts**

```ts
import type { ExportTarget } from '../types'

export interface ExportPresetEntry {
  key: string
  label: string
  group: string
  width: number
  height: number
}

export const EXPORT_PRESETS: ExportPresetEntry[] = [
  // Instagram
  { key: 'ig-portrait', label: 'Post (Portrait)', group: 'Instagram', width: 1080, height: 1350 },
  { key: 'ig-square', label: 'Post (Square)', group: 'Instagram', width: 1080, height: 1080 },
  { key: 'ig-story', label: 'Story / Reel', group: 'Instagram', width: 1080, height: 1920 },
  // TikTok
  { key: 'tt-post', label: 'Post', group: 'TikTok', width: 1080, height: 1920 },
  // Facebook
  { key: 'fb-feed', label: 'Feed', group: 'Facebook', width: 1200, height: 630 },
  { key: 'fb-square', label: 'Square', group: 'Facebook', width: 1080, height: 1080 },
  { key: 'fb-story', label: 'Story', group: 'Facebook', width: 1080, height: 1920 },
  // LinkedIn
  { key: 'li-post', label: 'Post', group: 'LinkedIn', width: 1200, height: 627 },
  { key: 'li-square', label: 'Square', group: 'LinkedIn', width: 1080, height: 1080 },
  // X (Twitter)
  { key: 'x-post', label: 'Post', group: 'X (Twitter)', width: 1600, height: 900 },
  // Pinterest
  { key: 'pin-pin', label: 'Pin', group: 'Pinterest', width: 1000, height: 1500 },
  // YouTube
  { key: 'yt-thumb', label: 'Thumbnail', group: 'YouTube', width: 1280, height: 720 },
]

export function getTargetDimensions(target: ExportTarget): { width: number; height: number } {
  if (target.type === 'custom') {
    return target.dimensions
  }
  const preset = EXPORT_PRESETS.find(p => p.key === target.key)
  if (!preset) return { width: 1080, height: 1350 }
  return { width: preset.width, height: preset.height }
}

export function getTargetLabel(target: ExportTarget): string {
  if (target.type === 'custom') {
    return `${target.dimensions.width}×${target.dimensions.height}`
  }
  const preset = EXPORT_PRESETS.find(p => p.key === target.key)
  return preset ? `${preset.group} — ${preset.label}` : 'Custom'
}
```

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: no errors.

---

### Task 3: useLocalStorage Hook

**Files:**
- Create: `src/hooks/useLocalStorage.ts`

**Interfaces:**
- Consumes: nothing
- Produces: `useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void]`

- [ ] **Step 1: Create the hook**

```ts
import { useState, useCallback } from 'react'

export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : defaultValue
    } catch {
      return defaultValue
    }
  })

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue(prev => {
        const next = value instanceof Function ? value(prev) : value
        try {
          localStorage.setItem(key, JSON.stringify(next))
        } catch { /* quota exceeded — silently skip */ }
        return next
      })
    },
    [key],
  )

  return [storedValue, setValue]
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

---

### Task 4: ThemeContext (Dark/Light Mode)

**Files:**
- Create: `src/contexts/ThemeContext.tsx`

**Interfaces:**
- Consumes: `useLocalStorage` hook
- Produces: `ThemeContext` with `{ theme: 'light' | 'dark', toggleTheme: () => void }`
- Side effect: sets `data-theme` attribute on `<html>` element

- [ ] **Step 1: Create ThemeContext**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [savedTheme, setSavedTheme] = useLocalStorage<Theme | null>('ipg-theme', null)

  const [theme, setThemeState] = useState<Theme>(() => {
    if (savedTheme) return savedTheme
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  const setTheme = (t: Theme) => {
    setThemeState(t)
    setSavedTheme(t)
  }

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
```

- [ ] **Step 2: Verify compiles**

```bash
npx tsc --noEmit
```

---

### Task 5: SettingsContext (Global App State)

**Files:**
- Create: `src/contexts/SettingsContext.tsx`

**Interfaces:**
- Consumes: `useLocalStorage`
- Produces: `SettingsContext` with `{ settings: AppSettings, dispatch: React.Dispatch<SettingsAction>, addImages: ..., removeImage: ... }`

- [ ] **Step 1: Create SettingsContext**

```tsx
import { createContext, useContext, useReducer, type ReactNode } from 'react'
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
  const [savedSettings, setSavedSettings] = useLocalStorage('ipg-settings', DEFAULT_SETTINGS)
  const [settings, dispatch] = useReducer(settingsReducer, savedSettings)

  // Persist settings changes
  const prevRef = { current: settings }
  prevRef.current = settings
  // Sync to localStorage via a simpler approach — serialize on dispatch
  // Instead, we use a useEffect-like pattern: after each render, persist
  // But since we can't use useEffect here, we persist in the dispatch

  return (
    <SettingsContext.Provider value={{ settings, settingsDispatch: dispatch, ... }}>
      {children}
    </SettingsContext.Provider>
  )
}
```

Actually, writing inline code in the plan is getting large. Let me write more compactly — the key is the structure and interfaces, not reproducing every line of implementation code here. The engineer (me) will implement when executing.

Let me just write the plan at a higher level with clear step descriptions rather than full code. The plan should document what each file does and its interfaces, not duplicate the implementation.

Let me start over on the plan with appropriate detail levels.<｜end▁of▁thinking｜>Let me write the plan more efficiently — clear task boundaries with interfaces and key decisions rather than reproducing every implementation line.

<｜｜DSML｜｜tool_calls>
<｜｜DSML｜｜invoke name="Write">
<｜｜DSML｜｜parameter name="content" string="true"># InstaPhotoGen V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a pure client-side React SPA that transforms raw images into social-media-ready exports with EXIF metadata overlays, supporting 13 export presets + custom, batch processing, dark mode, and persistent settings.

**Architecture:** Single-page React 18 + Vite 5 + TypeScript app. No backend. EXIF extraction via `exifr`, canvas rendering via native Canvas API, batch export via `jszip`. State via React Context + useReducer, persisted to localStorage. Deployed via GitHub Pages.

**Tech Stack:** React 18, Vite 5, TypeScript, exifr, jszip, CSS Modules + CSS custom properties.

## Global Constraints

- Pure client-side — no backend, no API calls, no database
- All image processing via native Canvas API
- Deterministic rendering: same inputs → same pixel output
- Non-destructive image handling: never crop or distort images
- GitHub Pages: Vite `base: './'` for relative asset paths
- TypeScript strict mode
- Max 2 runtime deps (exifr, jszip)
- Dark mode respects `prefers-color-scheme` if no saved preference
- All settings persisted to localStorage
- No component library, no CSS framework

---

### Task 1: Project Scaffold & Config

**Files:**
- `package.json`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — Vite template
- `vite.config.ts` — `base: './'` for GH Pages
- `index.html` — root with `<div id="root">`
- `src/main.tsx` — renders `<App />`
- `src/vite-env.d.ts` — Vite type reference
- `.gitignore`

**Interfaces:** Produces a `npm run dev` / `npm run build` pipeline. Build output in `dist/`.

- [ ] `npm create vite@latest . -- --template react-ts`
- [ ] `npm install exifr jszip`
- [ ] `npm install -D gh-pages`
- [ ] Set `vite.config.ts` base: `'./'`, add scripts: `"deploy": "gh-pages -d dist"`
- [ ] Set `tsconfig.json` strict: true
- [ ] Create `.gitignore` with `node_modules`, `dist`, `*.local`
- [ ] Create `src/main.tsx` that renders `<App />` in StrictMode
- [ ] `npm run build` to verify

- [ ] `git init && git add -A && git commit -m "feat: scaffold Vite + React + TS"`

---

### Task 2: Types + Export Targets

**Files:**
- Create: `src/types.ts` — all shared TypeScript types
- Create: `src/lib/targets.ts` — ExportPresetEntry[] array and `getTargetDimensions()`, `getTargetLabel()`

**Key types:**
```ts
ExportPresetEntry { key, label, group, width, height }
ExportTarget = { type: 'preset', key: string } | { type: 'custom', dimensions: { width, height } }
AppSettings { exportTarget, metadataFields[], metadataOverrides, fontFamily, spacing, darkMode, branding }
NormalizedMetadata { camera, lens, aperture, shutter, iso, focal, focal35, ev, wb, metering, flash, date }
ImageEntry { id, file, img: HTMLImageElement, metadata }
MetadataFieldConfig { key, label, enabled }
SpacingConfig { textSize, textOffsetY, xInset }
BrandingConfig { enabled, text, position, logo }
```

**Export presets (13):** All from the design spec (Instagram 3, TikTok 1, Facebook 3, LinkedIn 2, X 1, Pinterest 1, YouTube 1, plus Custom).

- [ ] Create `src/types.ts` with all interfaces
- [ ] Create `src/lib/targets.ts` with EXPORT_PRESETS array and helper functions
- [ ] `npx tsc --noEmit` to verify

---

### Task 3: useLocalStorage Hook

**File:**
- Create: `src/hooks/useLocalStorage.ts`

**Interface:**
```ts
useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void]
```
Handles JSON parse/stringify, catches quota errors silently.

- [ ] Create the hook with lazy init from localStorage
- [ ] `npx tsc --noEmit`

---

### Task 4: ThemeContext

**File:**
- Create: `src/contexts/ThemeContext.tsx`

**What it does:**
- Reads saved theme from localStorage (`ipg-theme`)
- Falls back to `prefers-color-scheme` if no saved value
- Sets `data-theme` attribute on `<html>` on change
- Exports `ThemeProvider` + `useTheme()` hook with `{ theme, toggleTheme, setTheme }`

- [ ] Create ThemeContext with Provider + consumer hook
- [ ] `npx tsc --noEmit`

---

### Task 5: SettingsContext

**File:**
- Create: `src/contexts/SettingsContext.tsx`

**What it does:**
- `useReducer` with actions: SET_EXPORT_TARGET, TOGGLE_METADATA_FIELD, REORDER_METADATA_FIELDS, SET_METADATA_OVERRIDES, SET_FONT, SET_SPACING, SET_BRANDING
- Images array state (add, remove, clear, select)
- Persists `AppSettings` to localStorage via `useLocalStorage`

**Default settings:**
- Export target: Instagram Post (Portrait)
- Metadata fields: camera/lens off, aperture/shutter/iso/focal on, others off, line break between focal and focal35
- Font: Inter, spacing: { textSize: 32, textOffsetY: 32, xInset: 32 }
- Branding: disabled

- [ ] Create reducer + provider with image state management
- [ ] Export `SettingsProvider`, `useSettings()` hook returning `{ settings, dispatch, images, addImages, removeImage, clearImages, selectedImageIdx, setSelectedImageIdx }`
- [ ] `npx tsc --noEmit`

---

### Task 6: EXIF Extraction + Normalization

**File:**
- Create: `src/lib/exif.ts`

**Functions:**
```ts
extractMetadata(file: File): Promise<Partial<NormalizedMetadata>>
```
Uses `exifr.parse(file)` with specific tag selection for performance. Normalizes each field:

| EXIF tag | Normalized | Example |
|----------|-----------|---------|
| Make + Model | `"Make Model"` | `"Sony ILCE-7RM5"` |
| LensModel | raw string | `"FE 24-70mm F2.8 GM II"` |
| FNumber | `"f/N"` | `"f/2.8"` |
| ExposureTime | `"1/125s"` or `"0.5s"` | `"1/125s"` |
| ISOSpeedRatings | `"ISO N"` | `"ISO 400"` |
| FocalLength | `"Nmm"` | `"50mm"` |
| FocalLengthIn35mm | `"Nmm (35mm)"` | `"75mm (35mm)"` |
| ExposureBiasValue | `"+N EV"` | `"+0.3 EV"` |
| WhiteBalance | `"WB Name"` | `"WB Daylight"` |
| MeteringMode | `"Metering Name"` | `"Metering Multi-segment"` |
| Flash | `"Flash Status"` | `"Flash Did Not Fire"` |
| DateTimeOriginal | `"YYYY-MM-DD HH:MM"` | `"2025-06-22 14:30"` |

Tags requested from exifr: `['Make', 'Model', 'LensModel', 'FNumber', 'ExposureTime', 'ISOSpeedRatings', 'FocalLength', 'FocalLengthIn35mm', 'ExposureBiasValue', 'WhiteBalance', 'MeteringMode', 'Flash', 'DateTimeOriginal']`.

Also: `loadImage(file: File): Promise<HTMLImageElement>` — loads file into Image element via ObjectURL.

- [ ] Create `extractMetadata()` with all normalization functions
- [ ] Create `loadImage()` helper
- [ ] `npx tsc --noEmit`

---

### Task 7: Canvas Renderer

**File:**
- Create: `src/lib/renderer.ts`

**Core function:**
```ts
function renderCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  metadata: NormalizedMetadata,
  settings: AppSettings,
  theme: 'light' | 'dark',
  imageIdx?: number,
  totalImages?: number,
): HTMLCanvasElement
```

**Pipeline:**
1. Create offscreen canvas at exact target dimensions × `devicePixelRatio`, scale context
2. Fill background: `#ffffff` (light) / `#1a1a1e` (dark)
3. Place image: fit into canvas bounds preserving aspect ratio, center (no crop, no stretch)
4. If image has margin (don't fill both dimensions completely), optionally draw a thin subtle border around it
5. Compose metadata text: iterate `settings.metadataFields` in order, skip disabled, respect `__linebreak__`, join enabled field values on same line with spaces, newline at linebreaks. Append `settings.metadataOverrides` at the end.
6. Draw metadata text at bottom region: x = xInset, y = image bottom + textOffsetY, or if image fills canvas, y = canvas height - padding
7. Apply `settings.fontFamily`, `settings.spacing.textSize`
8. Text color: `#ffffff` (light) / `#e0e0e0` (dark)
9. If branding enabled and image doesn't fill full height: draw branding text in margin area at configured position

Also: `renderAllImages(images, settings, theme): HTMLCanvasElement[]` — iterates `images`, calls `renderCanvas` for each.

- [ ] Implement `renderCanvas()` with full pipeline
- [ ] Implement `renderAllImages()` for batch
- [ ] `npx tsc --noEmit`

---

### Task 8: Export Utilities

**File:**
- Create: `src/lib/export.ts`

**Functions:**
```ts
function exportSingle(canvas: HTMLCanvasElement, filename?: string): void
```
- `canvas.toBlob('image/png')` → `URL.createObjectURL` → `<a>` click → revoke

```ts
async function exportBatch(canvases: { canvas: HTMLCanvasElement; metadata: NormalizedMetadata }[]): Promise<void>
```
- New JSZip instance
- For each canvas: `.toBlob()` → `zip.file(filename, blob)`
- Filename: `iphoto_YYYY-MM-DD_HH-MM-SS.png` (from `DateTimeOriginal` if available, else `Date.now()`)
- `zip.generateAsync({ type: 'blob' })` → download

- [ ] Implement `exportSingle()`
- [ ] Implement `exportBatch()` with JSZip
- [ ] `npx tsc --noEmit`

---

### Task 9: Global Styles + Theme Tokens

**File:**
- Create: `src/styles/global.css`

**What it includes:**
- CSS reset (box-sizing, margin 0, font inheritance)
- CSS custom properties on `:root` and `[data-theme="dark"]`:
  - `--bg-primary`, `--bg-secondary`, `--bg-elevated`
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - `--border`, `--accent`, `--accent-hover`
  - `--radius-sm`, `--radius-md`, `--radius-lg`
  - `--shadow-sm`, `--shadow-md`
- Google Fonts import for Inter via `@import` in CSS
- Body: font-family Inter, smooth transitions on bg/text colors
- Responsive breakpoint variables: `--bp-tablet: 1024px`, `--bp-mobile: 768px`

- [ ] Create global.css with all theme tokens
- [ ] Import in `main.tsx`

---

### Task 10: Control Panel Components

**Files:**
- Create: `src/components/ControlPanel/UploadSection.tsx`
- Create: `src/components/ControlPanel/ExportTargetSelect.tsx`
- Create: `src/components/ControlPanel/MetadataPanel.tsx`
- Create: `src/components/ControlPanel/StylingPanel.tsx`
- Create: `src/components/ControlPanel/BrandingPanel.tsx`
- Create: `src/components/ControlPanel/BatchExport.tsx`
- Create: `src/components/ControlPanel/ControlPanel.tsx`
- Create: `src/styles/ControlPanel.module.css`

**Each component:**

**UploadSection** — file input (accept="image/*" multiple), drag-drop zone with visual feedback, shows image count. On file select: reads each file via `loadImage()` + `extractMetadata()`, calls `addImages()` from settings context.

**ExportTargetSelect** — dropdown grouped by platform (optgroup), plus "Custom" option. On custom: shows two number inputs for width/height. Dispatches `SET_EXPORT_TARGET`.

**MetadataPanel** — renders `settings.metadataFields` as a drag-reorderable list. Each item: checkbox toggle + label. `__linebreak__` renders as a visual "— Line Break —" divider. Drag via HTML5 drag/drop events (no library). Textarea for `metadataOverrides`.

**StylingPanel** — font dropdown (Inter, SF Pro, Roboto, Helvetica, Playfair Display, Source Serif 4), three range sliders: text size (18-128), text offset Y (0-200), X inset (0-200). Sliders show current value.

**BrandingPanel** — initially collapsed (disabled by default). Toggle to enable. Text input for brand text. Position radio: bottom-left / bottom-right. All hidden when disabled.

**BatchExport** — "Export All" button, shown only when images.length > 1. Calls `renderAllImages()` then `exportBatch()`.

**ControlPanel** — scrollable sidebar wrapper. Renders all above sections in order. Collapsible section headers with chevron toggle. Sections persist open/closed state.

- [ ] Create UploadSection with drag-drop + file handler
- [ ] Create ExportTargetSelect with grouped options + custom inputs
- [ ] Create MetadataPanel with drag-reorder list + textarea
- [ ] Create StylingPanel with font select + spacing sliders
- [ ] Create BrandingPanel with toggle + text + position
- [ ] Create BatchExport button
- [ ] Create ControlPanel composing all sections with collapsible groups
- [ ] Create ControlPanel.module.css
- [ ] `npx tsc --noEmit`

---

### Task 11: Preview Components

**Files:**
- Create: `src/components/PreviewPane/CanvasPreview.tsx`
- Create: `src/components/PreviewPane/ImageCarousel.tsx`
- Create: `src/components/PreviewPane/PreviewPane.tsx`
- Create: `src/styles/PreviewPane.module.css`

**CanvasPreview** — renders the active image on a canvas. On any settings/image change:
1. `useEffect` triggers re-render via `renderCanvas()`
2. Canvas element gets rendered result appended as child (or uses a ref with `replaceChildren()`)
3. CSS: `max-width: 100%`, `height: auto`, with background matching theme

**ImageCarousel** — horizontal thumbnail strip. Shows when images.length > 1. Each thumbnail: small canvas or img, click to select. Active thumbnail highlighted. Scrollable horizontally.

**PreviewPane** — wraps CanvasPreview + ImageCarousel. Header showing "Preview" + current image filename. A "Download" button for single export.

- [ ] Create CanvasPreview with reactive re-rendering
- [ ] Create ImageCarousel thumbnail strip
- [ ] Create PreviewPane wrapping both + download button
- [ ] Create PreviewPane.module.css
- [ ] `npx tsc --noEmit`

---

### Task 12: App Shell

**File:**
- Create: `src/App.tsx`
- Modify: `src/styles/global.css`

**App.tsx:**
```tsx
// Wraps everything in providers:
<ThemeProvider>
  <SettingsProvider>
    <div className="app-shell">
      <header className="app-header">
        <h1>InstaPhotoGen</h1>
        <button onClick={toggleTheme}>🌙 / ☀️</button>
      </header>
      <div className="app-body">
        <ControlPanel />
        <PreviewPane />
      </div>
    </div>
  </SettingsProvider>
</ThemeProvider>
```

**Responsive layout in global.css:**
- `.app-body`: `display: grid; grid-template-columns: 380px 1fr; gap: 24px;`
- At `<1024px`: single column, ControlPanel max-height with scroll
- At `<768px`: full width, touch-friendly min 44px targets
- Smooth `transition` on `grid-template-columns` for responsive breakpoints

- [ ] Write `App.tsx` composing providers + layout
- [ ] Run `npm run build` — verify clean build
- [ ] Commit: `git add -A && git commit -m "feat: implement InstaPhotoGen V2"`

---

### Verification Checklist

After all tasks:

- [ ] `npm run build` succeeds with no TS or build errors
- [ ] `npm run dev` starts, app loads without console errors
- [ ] Upload an image → preview renders with metadata overlay
- [ ] Toggle metadata fields → preview updates immediately
- [ ] Drag-reorder metadata → preview reflects new order
- [ ] Switch export target → canvas resizes to new dimensions
- [ ] Set custom dimensions → canvas matches
- [ ] Toggle dark mode → all surfaces update
- [ ] Change font/size/spacing → preview updates
- [ ] Enable branding → text appears in margin
- [ ] Upload multiple images → thumbnails appear, click to switch
- [ ] "Export" single image → downloads PNG
- [ ] "Export All" → downloads ZIP with correctly named files
- [ ] Refresh page → all settings restored
- [ ] Open in private window → respects system dark mode preference
- [ ] Resize to mobile width → layout stacks vertically
- [ ] `npm run build && npx serve dist` — production build serves correctly
