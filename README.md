# InstaPhotoGen

A browser-based photo metadata overlay tool for photographers. Upload images, select which EXIF fields to display, and export styled photos ready for social media — all client-side, no uploads to any server.

## Features

- **Drag-and-drop** image upload (supports JPEG, PNG, WebP, TIFF)
- **EXIF metadata extraction** — camera, lens, aperture, shutter speed, ISO, focal length, and more
- **Left/right text layout** — assign metadata fields to either side of the image
- **Auto-compose text** — toggling fields auto-generates the text, or type your own
- **Canvas rendering** — preserves full image resolution, no downscaling
- **Export presets** — Instagram (portrait, square, story), TikTok, Facebook, LinkedIn, X/Twitter, Pinterest, YouTube thumbnail
- **Batch export** — download multiple images as a ZIP
- **Dark mode**

## Quick Start

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run deploy   # Publish to GitHub Pages
```

## Stack

- **Vite** + **React 18** + **TypeScript**
- **Canvas 2D** — no canvas library dependencies
- **ExifReader** — client-side EXIF extraction
- **JSZip** — batch export

## License

MIT
