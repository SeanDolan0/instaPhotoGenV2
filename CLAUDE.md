# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check + production build (tsc -b && vite build)
npm run preview   # Preview production build locally
npm run deploy    # Deploy dist/ to GitHub Pages via gh-pages
```

No test runner is configured (no test dependencies in package.json).

## Architecture

Vite + React 18 + TypeScript SPA. Pure Canvas 2D rendering — no canvas library dependencies. Image metadata extracted client-side via exifreader.

### Directory Layout

```
src/
├── types.ts                   # All shared types: AppSettings, ImageEntry, NormalizedMetadata, etc.
├── lib/                       # Pure logic, no React imports
│   ├── exif.ts                # EXIF extraction + normalization from image files
│   ├── renderer.ts            # Canvas 2D drawing — photo + metadata text + branding
│   ├── export.ts              # Single PNG download + batch ZIP export (JSZip)
│   └── targets.ts             # Export preset definitions (Instagram, TikTok, etc.)
├── contexts/
│   ├── SettingsContext.tsx     # All app state: useReducer + localStorage persist
│   └── ThemeContext.tsx        # Light/dark theme toggle, persisted
├── hooks/
│   └── useLocalStorage.ts     # Generic localStorage hook with JSON serialize/parse
├── components/
│   ├── ControlPanel/          # Left sidebar
│   │   ├── ControlPanel.tsx   # Composes all panel sections
│   │   ├── UploadSection.tsx  # Drag-drop or click file input
│   │   ├── ExportTargetSelect.tsx  # Preset dimensions picker + custom
│   │   ├── MetadataPanel.tsx       # EXIF field toggles, side assignment, drag-reorder
│   │   ├── StylingPanel.tsx        # Font, photo/text size, insets, text color
│   │   ├── BrandingPanel.tsx       # Watermark text + position
│   │   └── BatchExport.tsx         # Export all images as ZIP (only visible with 2+ images)
│   └── PreviewPane/           # Main content area
│       ├── PreviewPane.tsx    # Header + canvas + carousel
│       ├── CanvasPreview.tsx  # Renders live canvas preview via renderer.ts
│       └── ImageCarousel.tsx  # Thumbnail strip for multi-image navigation
├── styles/
│   ├── global.css             # CSS custom properties (light/dark), reset, layout grid
│   ├── ControlPanel.module.css
│   └── PreviewPane.module.css
└── main.tsx                   # Entry point, mounts App
```

### Data Flow

1. **State**: `AppSettings` lives in `SettingsContext` via `useReducer`, synced to `localStorage` on every render. Images are `ImageEntry[]` in a separate `useState`, not persisted.
2. **EXIF extraction**: `UploadSection` calls `loadImage()` + `extractMetadata()` from `exif.ts` per file. Results stored in `ImageEntry.metadata`.
3. **Text composition**: `MetadataPanel` runs `composeText()` on every render, deriving `metadataText` / `metadataTextRight` strings from enabled fields. User can override these textareas manually.
4. **Rendering**: `CanvasPreview` calls `renderCanvas()` on every settings/image/theme change, drawing photo → metadata → branding onto an `<canvas>`. Canvas preserves native image resolution, expanding the canvas to match the target aspect ratio.
5. **Export**: `exportSingle()` (PNG download) and `exportBatch()` (ZIP via JSZip, dynamically imported). Both use `canvas.toBlob('image/png')`.

### Key Design Decisions

- **No image downscaling**: Canvas is sized to the *larger* of (native resolution, target aspect ratio) — images are never scaled down, only padded.
- **Metadata text is auto-composed but editable**: Toggling EXIF fields regenerates the textarea content, but edits to the textarea are preserved as manual overrides.
- **CSS Modules + custom properties**: Component-scoped styles via CSS Modules, theme switching via `[data-theme]` attribute and `--var` overrides on `:root`.
- **Settings migration**: `SettingsContext` handles old localStorage schemas (missing `side` field on metadata fields, missing `__linebreak_right__`).
- **No routing**: Single-page app, no router.

### Export Presets

Defined in `targets.ts`. Covers Instagram (portrait, square, story), TikTok, Facebook (feed, square, story), LinkedIn, X/Twitter, Pinterest, YouTube thumbnail. Custom dimensions also supported.
