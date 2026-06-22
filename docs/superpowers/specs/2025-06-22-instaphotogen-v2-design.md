# InstaPhotoGen V2 — Design Specification

## Overview

InstaPhotoGen V2 transforms raw camera images into polished, social-media-ready exports with metadata overlays. It is a pure client-side single-page application — no backend, no server-side processing, no database. Everything runs in the browser.

---

## Stack

| Layer | Choice |
|-------|--------|
| Framework | React 18 |
| Build | Vite 5 |
| Language | TypeScript |
| Styling | CSS Modules + CSS custom properties (theming) |
| EXIF extraction | `exifr` (lighter, async-friendly) |
| Batch export | `jszip` |
| Canvas rendering | Native Canvas API (no wrapper) |
| Persistence | `localStorage` |

No component library, no state management library beyond React Context + useReducer.

---

## Architecture

```
App
├── ThemeProvider          — reads/writes dark mode, sets CSS vars on <html>
├── SettingsProvider       — useReducer + localStorage sync
├── ControlPanel           — collapsible sidebar, left/top
│   ├── UploadSection
│   ├── ExportTargetSelect
│   ├── MetadataPanel
│   │   ├── MetadataOrderList (drag-reorder + toggle)
│   │   └── MetadataOverride
│   ├── StylingPanel
│   ├── BrandingPanel
│   └── BatchExport
└── PreviewPane            — right/bottom
    ├── CanvasPreview
    └── ImageCarousel (multi-image thumbnails)
```

## Data Flow

```
Upload → File → ImageLoader
                 ├── reads as Image (for display/render)
                 └── reads as ArrayBuffer → exifr → NormalizedMetadata[]

Settings (localStorage-persisted)
  ├── exportTarget
  ├── metadataFields (order + enabled)
  ├── typography
  ├── spacing
  ├── darkMode
  ├── branding
  └── images[]

Render → CanvasRenderer(image, exportTarget, metadata[], styling)
         → <canvas> element (display + export source)

Export → canvas.toBlob('image/png') → single DL
       → JSZip(blobs) → zip download (batch)
```

---

## Export Target System

Each target defines fixed width × height. Rendering scales the image to fit within these bounds (preserving aspect ratio, no crop, no stretch). The canvas is always exactly at target dimensions.

Presets:

| Platform | Preset | Ratio | Width | Height |
|----------|--------|-------|-------|--------|
| Instagram | Post (Portrait) | 4:5 | 1080 | 1350 |
| Instagram | Post (Square) | 1:1 | 1080 | 1080 |
| Instagram | Story / Reel | 9:16 | 1080 | 1920 |
| TikTok | Post | 9:16 | 1080 | 1920 |
| Facebook | Feed | 1.91:1 | 1200 | 630 |
| Facebook | Square | 1:1 | 1080 | 1080 |
| Facebook | Story | 9:16 | 1080 | 1920 |
| LinkedIn | Post | 1.91:1 | 1200 | 627 |
| LinkedIn | Square | 1:1 | 1080 | 1080 |
| X (Twitter) | Post | 16:9 | 1600 | 900 |
| Pinterest | Pin | 2:3 | 1000 | 1500 |
| YouTube | Thumbnail | 16:9 | 1280 | 720 |
| Custom | — | — | user | user |

---

## Canvas Rendering Pipeline

1. **Create** offscreen `<canvas>` at target width × height × `devicePixelRatio`
2. **Fill** background: `#ffffff` (light), `#1a1a1a` (dark)
3. **Place image**: scale to fit canvas bounds while preserving aspect ratio, center
4. **Branding** (if enabled): draw text/logo in margin zone (bottom-left or bottom-right)
5. **Metadata text**: compose toggled-on fields in configured order with line breaks, draw at configured position/size/font
6. **Return** canvas — displayed in PreviewPane, used as source for export

All rendering is deterministic: same inputs → same canvas pixels. The display canvas is scaled for preview (`width: 100%` CSS), while the offscreen render canvas uses exact target dimensions.

---

## Metadata Normalization

`exifr` returns raw EXIF values. Each field maps through a normalizer:

| EXIF Tag | Normalized Form | Example |
|----------|----------------|---------|
| `Make` + `Model` | `"Make Model"` | `"Sony ILCE-7RM5"` |
| `LensModel` | `"Lens Name"` | `"FE 24-70mm F2.8 GM II"` |
| `FNumber` | `"f/N"` | `"f/2.8"` |
| `ExposureTime` | `"N/Ns"` | `"1/125s"` |
| `ISOSpeedRatings` | `"ISO N"` | `"ISO 400"` |
| `FocalLength` | `"Nmm"` | `"50mm"` |
| `FocalLengthIn35mm` | `"Nmm (35mm)"` | `"75mm (35mm)"` |
| `ExposureBiasValue` | `"+N EV"` | `"+0.3 EV"` |
| `WhiteBalance` | `"WB Name"` | `"WB Daylight"` |
| `MeteringMode` | `"Metering Name"` | `"Metering Multi-segment"` |
| `Flash` | `"Flash Status"` | `"Flash Did Not Fire"` |
| `DateTimeOriginal` | `"YYYY-MM-DD HH:MM"` | `"2025-06-22 14:30"` |
| GPS (lat/lon) | `"lat, lon"` | `"35.6762, 139.6503"` |

Users can toggle each field on/off and reorder them via drag. A "line break" element can be inserted between fields. A free-text override box appends additional text.

---

## State Management

Single `SettingsContext` with `useReducer`. Actions:

- `SET_EXPORT_TARGET`
- `ADD_IMAGES` / `REMOVE_IMAGE`
- `TOGGLE_METADATA_FIELD` / `REORDER_METADATA_FIELDS` / `SET_METADATA_OVERRIDE`
- `SET_FONT` / `SET_SPACING` / `TOGGLE_DARK_MODE`
- `SET_BRANDING`

Every state change triggers `useEffect` → `localStorage.setItem('ipg-settings', ...)`.

On load, settings are restored from localStorage. Dark mode falls back to `prefers-color-scheme` if no saved value exists.

---

## Responsive Layout

| Breakpoint | Layout |
|-----------|--------|
| ≥1024px | Side-by-side: control panel (380px) + preview |
| 768–1023px | Control panel as slide-over drawer, preview full-width |
| <768px | Single column, collapsible sections, 44px+ touch targets |

---

## Export System

- **Single**: `canvas.toBlob('image/png')` → object URL → `<a download>`
- **Batch**: iterate images → render each to offscreen canvas → collect blobs → `jszip` → download
- **Filename**: `iphoto_YYYY-MM-DD_HH-MM-SS.png` (from timestamp or `DateTimeOriginal` when available)

---

## File Structure

```
src/
├── App.tsx
├── main.tsx
├── contexts/
│   ├── ThemeContext.tsx
│   └── SettingsContext.tsx
├── components/
│   ├── ControlPanel/
│   │   ├── ControlPanel.tsx
│   │   ├── UploadSection.tsx
│   │   ├── ExportTargetSelect.tsx
│   │   ├── MetadataPanel.tsx
│   │   ├── StylingPanel.tsx
│   │   ├── BrandingPanel.tsx
│   │   └── BatchExport.tsx
│   └── PreviewPane/
│       ├── PreviewPane.tsx
│       ├── CanvasPreview.tsx
│       └── ImageCarousel.tsx
├── lib/
│   ├── exif.ts          — EXIF extraction + normalization
│   ├── renderer.ts      — Canvas rendering pipeline
│   ├── export.ts        — Single + batch export
│   └── targets.ts       — Export target presets
├── hooks/
│   └── useLocalStorage.ts
└── styles/
    ├── global.css       — CSS vars, resets, theme tokens
    └── *.module.css     — Component-scoped styles
```

---

## Dependencies (total: 2 runtime + 1 dev)

- `exifr` — EXIF extraction
- `jszip` — batch ZIP export
- `typescript` (dev) — type checking
- Everything else is native to the platform
