# Task 1: Project Scaffold & Config

## Goal
Initialize a Vite + React + TypeScript project with GitHub Pages-compatible configuration.

## Steps
1. `npm create vite@latest . -- --template react-ts` (answer "yes" to existing dir)
2. `npm install exifr jszip`
3. `npm install -D gh-pages`
4. Edit `vite.config.ts` — set `base: './'` for GH Pages relative paths
5. Edit `package.json` scripts to add: `"deploy": "gh-pages -d dist"`
6. Ensure `tsconfig.json` has `strict: true`
7. Create `.gitignore` with: node_modules, dist, *.local
8. Replace `index.html` with clean template — title "InstaPhotoGen", single `<div id="root">`
9. Create `src/main.tsx` — renders `<App />` in StrictMode, imports `./styles/global.css`
10. Create `src/vite-env.d.ts` — `/// <reference types="vite/client" />`
11. Verify: `npm run build` — must succeed, produce `dist/` with index.html + assets/
12. `git init && git add -A && git commit -m "feat: scaffold Vite + React + TypeScript project"`

## Constraints
- Pure client-side — no backend, no API calls, no database
- GitHub Pages: Vite `base: './'` for relative asset paths
- TypeScript strict mode enabled
- Max 2 runtime deps (exifr, jszip)
- No component library, no CSS framework

## Output
- Working `npm run dev` dev server
- Working `npm run build` producing `dist/` with relative paths
- All Vite-generated boilerplate (App.css, default counter) should be removed
