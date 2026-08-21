# Location Feature Design

## Context

Photographers posting to social media often want to display location information on their photos — a city name, a park, coordinates — but the current app has no way to add location text without relying on EXIF geotagging data (which many photos lack, especially screenshots, edited exports, or phone photos with GPS stripped). This feature adds a dedicated Location section with freeform text input and an optional embedded map picker.

## Goals

- Let users type any location text and display it on the exported photo
- Provide an embedded map picker (Leaflet/OpenStreetMap) for visual location selection
- Support three display formats: place name, coordinates, or both
- Allow the location text to be placed on the left or right side of the photo
- Support a global location setting with per-photo overrides
- Work within the existing metadata composition pipeline — no renderer changes

## Data Model

### New type: `LocationConfig`

```ts
interface LocationConfig {
  text: string           // freeform location text (e.g. "Kyoto, Japan")
  format: 'name' | 'coordinates' | 'both'
  lat: number | null     // from map pin or geocoding
  lng: number | null
  side: 'left' | 'right'
  perPhoto: Record<string, string>  // imageId → override text
}
```

### AppSettings addition

```ts
location: LocationConfig  // added to AppSettings
```

### Default state

```ts
location: {
  text: '',
  format: 'name',
  lat: null,
  lng: null,
  side: 'left',
  perPhoto: {},
}
```

### Reducer actions

| Action | Payload | Effect |
|--------|---------|--------|
| `SET_LOCATION_TEXT` | `string` | Update global location text |
| `SET_LOCATION_FORMAT` | `'name' \| 'coordinates' \| 'both'` | Toggle display format |
| `SET_LOCATION_COORDS` | `{ lat: number, lng: number }` | Set coordinates from map/geocoding |
| `SET_LOCATION_SIDE` | `'left' \| 'right'` | Switch which side text renders on |
| `SET_LOCATION_PER_PHOTO` | `{ imageId: string, text: string }` | Set override for specific image |
| `CLEAR_LOCATION_PER_PHOTO` | `string` (imageId) | Remove override, fall back to global |

### Persistence

`location` is serialized to localStorage with the rest of `AppSettings`. The `perPhoto` map uses ephemeral image IDs — overrides reset when images are re-uploaded, which is acceptable since location is a session-level concern.

## UI Design

### Location Section (`LocationSection.tsx`)

A new collapsible section in the control panel, positioned between Styling and Branding.

**Layout (top to bottom):**

1. **Text input** — single-line `<input type="text">` for freeform location. Placeholder: `"e.g. Kyoto, Japan"`. When a per-photo override is active, shows that image's text instead.

2. **Format toggle** — three toggle buttons in a row: `Name` | `Coords` | `Both`. Active button highlighted with accent color. Drives what text format is composed.

3. **Side selector** — `Left` | `Right` toggle button pair, same visual pattern as the metadata field side toggles. Determines which side the location text renders on.

4. **Per-photo override** — when 2+ images are loaded:
   - A checkbox: "Override for selected photo"
   - When checked, the text input switches to editing `location.perPhoto[selectedImageId]` instead of `location.text`
   - A small indicator shows which photo is being edited

5. **Map toggle button** — "Pick on map" button. Clicking expands/collapses the map below.

6. **Embedded map** — when expanded:
   - 200px tall, full sidebar width
   - Leaflet map with OpenStreetMap tiles
   - Initializes at world view (or user's geolocation if permitted)
   - Click to place/move a single pin
   - On pin drop: reverse geocodes via Nominatim → auto-fills text input with place name
   - Coordinates stored as `lat`/`lng` regardless of display format

### Map Component (`LocationMap.tsx`)

- Uses `leaflet` library (no `react-leaflet` — vanilla Leaflet with React refs to keep bundle smaller)
- Rendered conditionally when "Pick on map" is toggled on
- Map container: `div` with fixed 200px height, `position: relative` for Leaflet
- Single marker (draggable) — moving it updates coordinates and triggers reverse geocoding
- Cleanup: `map.remove()` on unmount to prevent Leaflet memory leaks

## Rendering Integration

### Composition (`MetadataPanel.tsx` — `composeText()`)

Location text is appended to the composed output **after** all metadata fields, on the side specified by `location.side`:

```
resolveLocationText():
  if perPhoto override exists for current image → use override text
  else → use location.text

  switch location.format:
    'name' → return resolvedText
    'coordinates' → return formatCoords(location.lat, location.lng)
    'both' → return resolvedText + '\n' + formatCoords(location.lat, location.lng)
```

The resolved string is appended to the appropriate side's composed text (left or right) with a newline separator if both metadata fields and location text exist.

### Canvas Rendering

**No changes to `renderer.ts`.** Location text flows through the existing `metadataText` / `metadataTextRight` strings and is drawn by the same `ctx.fillText()` calls. The renderer has no awareness of location specifically.

### Format helpers

```ts
formatCoords(lat: number, lng: number): string
  // Returns: "35.0116° N, 135.7681° E"
  // Negative lat → "S", negative lng → "W"
```

## Map Integration

### Dependencies

- `leaflet` — map rendering (~40KB gzipped)
- `@types/leaflet` — TypeScript types (dev only)
- OpenStreetMap tiles — free, no API key
- Nominatim — reverse geocoding, free, no API key

### Reverse geocoding

```
GET https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}
```

Response `display_name` field provides the place name. Debounced at 500ms to respect Nominatim's 1 req/sec rate limit.

### Offline behavior

- Text input works fully offline
- Map tiles and geocoding require internet
- If offline, map shows a loading/error state but text input remains functional

## Files to Change

### New files
- `src/components/ControlPanel/LocationSection.tsx`
- `src/components/ControlPanel/LocationMap.tsx`

### Modified files
- `src/types.ts` — add `LocationConfig`, add `location` to `AppSettings`
- `src/contexts/SettingsContext.tsx` — add reducer actions, default state, migration
- `src/components/ControlPanel/ControlPanel.tsx` — compose `LocationSection`
- `src/components/ControlPanel/MetadataPanel.tsx` — append location text in `composeText()`
- `src/styles/ControlPanel.module.css` — styles for location section and map

### Unchanged files
- `src/lib/renderer.ts` — receives pre-composed text, no changes
- `src/lib/exif.ts` — manual location, not EXIF extraction
- `src/lib/export.ts` — text already flows through existing pipeline

## Verification

1. Type location text → confirm it appears on the exported photo on the selected side
2. Toggle format between Name / Coords / Both → confirm display updates
3. Switch side (Left/Right) → confirm text moves to correct side
4. Load 2+ images → confirm per-photo override toggle appears
5. Enable per-photo override → confirm typing affects only the selected image
6. Click "Pick on map" → confirm map loads and is interactive
7. Click map to drop pin → confirm text input auto-fills with place name
8. Confirm coordinates format shows correct N/S/E/W direction
9. Export single photo → confirm location text renders correctly
10. Batch export → confirm each photo gets its correct location (global or override)
11. Carousel mode → confirm location text renders in panorama slices
12. Refresh page → confirm location settings persist via localStorage
