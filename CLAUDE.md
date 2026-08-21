# CLAUDE.md — InstaPhotoGen

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build (tsc -b && vite build)
npm run preview   # Preview production build locally
npm run deploy    # Deploy dist/ to GitHub Pages via gh-pages
```

No test runner or test dependencies in package.json. No linting configured.

## Stack & Dependencies

- Vite 5 + React 18 + TypeScript 5 + CSS Modules
- **Canvas 2D** — pure Canvas API, no canvas library dependencies
- **ExifReader** (`exifreader`) — client-side EXIF extraction from image files
- **JSZip** (`jszip`) — batch ZIP export (dynamically imported)
- **gh-pages** — deploy to GitHub Pages

No routing library. No state management library (uses `useReducer` + Context).

## Architecture Overview

Single-page app: left sidebar (control panel), right content area (preview canvas + thumbnail carousel). No server — everything runs in the browser.

### Entry Point

`src/main.tsx` → mounts `<App>` which wraps everything in `<ThemeProvider>` → `<SettingsProvider>` → renders `<ControlPanel>` + `<PreviewPane>` in a CSS grid layout (`app-body`).

### Directory Layout

```
src/
├── types.ts                        # All shared TypeScript types
├── lib/                            # Pure logic, no React imports
│   ├── exif.ts                     # EXIF extraction, normalization, image loading
│   ├── renderer.ts                 # Canvas 2D drawing: photo + metadata + branding
│   ├── export.ts                   # Single PNG download + batch ZIP via JSZip
│   └── targets.ts                  # Export preset definitions + dimension helpers
├── contexts/
│   ├── SettingsContext.tsx          # All app settings: useReducer + localStorage persist
│   └── ThemeContext.tsx             # Light/dark theme, persisted to localStorage
├── hooks/
│   └── useLocalStorage.ts          # Generic localStorage hook (JSON serialize/parse)
├── components/
│   ├── ControlPanel/               # Left sidebar
│   │   ├── ControlPanel.tsx        # Composes collapsible sections
│   │   ├── UploadSection.tsx       # Drag-drop or click file input
│   │   ├── ExportTargetSelect.tsx  # Preset dimensions picker + custom
│   │   ├── MetadataPanel.tsx       # EXIF field toggles, side assign, drag-reorder
│   │   ├── StylingPanel.tsx        # Font, photo/text size, insets, text color
│   │   ├── BrandingPanel.tsx       # Watermark text + position
│   │   └── BatchExport.tsx         # "Export All as ZIP" button (2+ images)
│   └── PreviewPane/                # Main content area
│       ├── PreviewPane.tsx         # Header + download button + canvas + carousel
│       ├── CanvasPreview.tsx       # Renders live canvas preview via renderer.ts
│       └── ImageCarousel.tsx       # Thumbnail strip for multi-image navigation
├── styles/
│   ├── global.css                  # CSS custom properties (light/dark), reset, layout grid
│   ├── ControlPanel.module.css     # Sidebar styles
│   └── PreviewPane.module.css      # Preview area styles
└── main.tsx                        # Entry point, mounts App
```

## Data Flow

### 1. State Management (`SettingsContext.tsx`)

**Settings state** (`AppSettings` type) lives in a `useReducer` and is synced to `localStorage` on every render (key: `ipg-settings`).

Reducer actions:
| Action | Payload | Effect |
|--------|---------|--------|
| `SET_EXPORT_TARGET` | `ExportTarget` | Set preset or custom dimensions |
| `TOGGLE_METADATA_FIELD` | `string` (field key) | Toggle a field's enabled state |
| `REORDER_METADATA_FIELDS` | `MetadataFieldConfig[]` | Replace full field list (drag-reorder) |
| `SET_METADATA_SIDE` | `{key, side}` | Move field between left/right |
| `SET_METADATA_TEXT` | `string` | Left-side text content |
| `SET_METADATA_TEXT_RIGHT` | `string` | Right-side text content |
| `SET_FONT` | `string` | Font family name |
| `SET_SPACING` | `Partial<SpacingConfig>` | textSize, textOffsetY, xInset, photoScale, textColor |
| `SET_BRANDING` | `Partial<BrandingConfig>` | enabled, text, position |

**Image state** (`ImageEntry[]`) is a separate `useState` — NOT persisted to localStorage. Images are ephemeral; only the last set of images loaded in the session.

**Selected index** (`selectedImageIdx`) tracks which image is displayed. Auto-clamps when images are removed.

**Migration**: On load, old localStorage schemas are migrated:
- Fields without a `side` property default to `'left'`
- Legacy `__linebreak_right__` field is stripped out (replaced by a single `__linebreak__` that applies to both sides)

### 2. Image Upload & EXIF (`exif.ts`)

`UploadSection` handles drag-and-drop and file input (JPEG/PNG/WebP/TIFF). For each file:
1. `loadImage(file)` — creates `HTMLImageElement` via `URL.createObjectURL`, returns promise
2. `extractMetadata(file)` — reads EXIF via `ExifReader.load()`, normalizes into `Partial<NormalizedMetadata>`

The `NormalizedMetadata` shape: `{ camera, lens, aperture, shutter, iso, focal, focal35, ev, wb, metering, flash, date }`

Normalization helpers convert raw EXIF values to display strings (e.g. `normalizeAperture("1.4")` → `"f/1.4"`, `normalizeShutter("1/250")` → `"1/250s"`).

### 3. Text Composition (`MetadataPanel.tsx`)

`composeText()` runs on every render (in a `useEffect`). It walks `metadataFields` in order, collecting enabled fields assigned to the requested side, and joins them into a string (one line per field, with `__linebreak__` fields inserting newlines). The result flows into `SET_METADATA_TEXT`/`SET_METADATA_TEXT_RIGHT`.

Key behavior: **`__linebreak__` fields bypass the `enabled` and `side` filters** — they always produce a line break in both left and right text. This is explicit in `composeText()`.

The textarea is editable — user overrides are preserved because the `useEffect` only dispatches on dependency changes, not on user edits. If a user types into the textarea, their text stays until a field toggle triggers re-composition.

### 4. Canvas Rendering (`renderer.ts`)

Two rendering modes:

**Standard mode** (`renderCanvas()`): Creates a new `<canvas>` element sized to the **larger** of (native image resolution, target aspect ratio). Images are never scaled down; canvas expands to match the target ratio; padding filled with white. The `photoScale` setting (<100%) shrinks the drawn image within the canvas, creating a white border. Rendering order:
1. White background (full canvas)
2. Photo image (centered, at `photoScale` of native resolution)
3. Left-side metadata text (below photo, left-aligned)
4. Right-side metadata text (below photo, right-aligned)
5. Branding/watermark (only in margin area below the photo, never overlapping it)

**Carousel mode** (`renderCarouselCanvas()`): Renders multiple photos side-by-side with uniform white borders on all sides. Used for the horizontal carousel export feature. Canvas width = sum of individual photo widths + gaps; height = tallest photo height.

`renderAllImages()` calls `renderCanvas()` for each image in a batch.

### 5. Export (`export.ts`)

**Single export**: `exportSingle(canvas)` — `canvas.toBlob('image/png')` → blob URL → temporary `<a>` download click.

**Batch export**: `exportBatch(items)` — dynamically imports `jszip`, converts each canvas to a PNG blob, adds to ZIP, triggers download.

### 6. Theme (`ThemeContext.tsx`)

- Persists user preference to localStorage (`ipg-theme`)
- Defaults to system preference via `prefers-color-scheme`
- Applies theme by setting `data-theme` attribute on `<html>` (light/dark)
- CSS custom properties on `[data-theme='dark']` override the `:root` light defaults

## Component Details

### Collapsible Sections (`ControlPanel.tsx`)

A local `Collapsible` component wraps each panel section with a toggle button. State is `useState` (per-section). Only "Photos" is open by default. Children receive a `compact` prop and conditionally suppress their own `<section>` wrapper and `<h3>` title when compact (they render just their content).

### Metadata Field Reorder (`MetadataPanel.tsx`)

Three reorder mechanisms:

1. **Up/Down buttons** (▲/▼) — click to swap with adjacent field. Always works.
2. **HTML5 Drag API** (desktop) — `draggable`, `onDragStart`, `onDragOver`, `onDragEnd`. Reorders on drag-over, not on drop.
3. **Touch drag** (mobile) — long-press activation pattern:
   - `longPressMs = 250` — hold duration before drag starts
   - `scrollCancelPx = 10` — movement threshold: if finger moves >10px before long-press fires, drag is cancelled (allows normal scrolling)
   - On long-press: sets `dragging = true`, dispatches `setDragIdx()`
   - On move while dragging: uses `document.elementFromPoint()` to find the target field by `[data-meta-idx]`, reorders immediately
   - Uses native `document.addEventListener('touchmove', ..., { passive: false })` to allow `preventDefault()` (React's React events register as passive by default, which throws on `preventDefault()`)
   - The handler is stored in a `useRef` to avoid re-attaching the listener on every render

### Image Carousel (`ImageCarousel.tsx`)

Thumbnail strip shown below the canvas when 2+ images are loaded. Clicking a thumbnail calls `setSelectedImageIdx()`. Each thumbnail has a remove button (×) that calls `removeImage(id)`.

### Export Presets (`targets.ts`)

Presets are grouped by platform. `getTargetDimensions()` resolves the active `ExportTarget` to pixel dimensions. `presetsGrouped()` returns presets organized by platform group for rendering grouped `<select>` options.

## Key Design Decisions

- **No image downscaling**: Canvas preserves native image resolution. The canvas is sized to the larger of (native res, target aspect ratio), so images are padded, never shrunk.
- **Metadata text is auto-composed but editable**: Toggling EXIF fields regenerates the textareas, but manual edits persist until the next toggle.
- **CSS Modules + CSS custom properties**: Component-scoped styles. Theme switching via `[data-theme]` attribute on `<html>`, all colors defined as `--var` overrides.
- **No routing**: Single-page app with no router.
- **No state management library**: `useReducer` + Context is sufficient for this app's complexity.
- **Dynamic import for JSZip**: `jszip` is only loaded on batch export, not on initial page load.
- **Canvas output is always PNG**: `canvas.toBlob('image/png')`. No JPEG quality configuration.
- **White canvas background**: Always white, independent of theme. The theme only affects the app UI, not the exported image.

## Types (`types.ts`)

Key types:
- `AppSettings` — full application settings object (serialized to localStorage)
- `MetadataFieldConfig` — individual field definition: `{ key, label, enabled, side }`
- `ExportTarget` — `{ type: 'preset', key }` or `{ type: 'custom', dimensions }`
- `SpacingConfig` — text size/position and photo scale settings
- `BrandingConfig` — watermark text, position, optional logo
- `NormalizedMetadata` — standardized EXIF fields (12 fields: camera, lens, aperture, shutter, iso, focal, etc.)
- `ImageEntry` — loaded image with file, HTMLImageElement, and extracted metadata

## Project History

Built as a tool for photographers to overlay EXIF metadata on social-media-ready image exports. Originally a simpler tool, expanded with multi-image support, batch export, touch-friendly reorder, dark mode, and mobile-responsive collapsible layout.
