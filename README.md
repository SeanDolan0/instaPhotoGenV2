# InstaPhotoGen

A client-side photo metadata overlay tool for photographers. Upload images, customize which EXIF fields to display, and export styled photos ready for social media — no server, no uploads.

## Features

- Drag-and-drop upload (JPEG, PNG, WebP, TIFF)
- EXIF extraction — camera, lens, aperture, shutter speed, ISO, focal length, and more
- Left/right text layout with drag-to-reorder
- Auto-composed metadata text or manual edit
- Full-resolution canvas rendering — images are never downscaled
- Export presets — Instagram, TikTok, Facebook, LinkedIn, X/Twitter, Pinterest, YouTube
- Carousel mode — multi-slide panorama export
- Batch ZIP export
- Dark mode

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Build & Deploy

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run deploy   # Publish to GitHub Pages
```

## Tech Stack

- Vite + React 18 + TypeScript
- Canvas 2D (no library dependencies)
- ExifReader (client-side EXIF extraction)
- JSZip (batch export)

## License

MIT
