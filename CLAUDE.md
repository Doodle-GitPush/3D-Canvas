# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:8080 (auto-opens browser)
npm run build      # Production build to dist/
npm run preview    # Preview the production build
npm run lint       # Run ESLint on all .js/.jsx files
```

There is no test suite in this project.

## Architecture

This is a React + Vite app named **Aetherius** — an infinite 3D canvas of design inspiration cards floating in a white void. The architecture is split into two completely separate layers that communicate through callbacks:

### Two-Layer Design

**Layer 1: Three.js scene** (`src/scene/`) — pure vanilla JS classes, no React. Owns the WebGL canvas, the render loop, all 3D objects, input handling, and camera.

**Layer 2: React UI overlay** (`src/components/`) — positioned `fixed` on top of the canvas using the `.react-overlay` CSS class. The click handler in `SpaceScene.js` calls `e.target.closest('.react-overlay')` to prevent click-throughs from reaching the Three.js raycaster. Any new React overlay element must have the `react-overlay` class.

### Scene Layer (`src/scene/`)

- **`SpaceScene.js`** — top-level orchestrator. Owns the Three.js renderer, camera, raycasting, and all pointer/wheel/gesture event listeners. Communicates back to React exclusively via the `reactCallbacks` object (`onCardFocus`, `onCardUnfocus`, `onHUDUpdate`) passed in from `App.jsx`. Camera uses a dual-target/actual lerp pattern: `targetCameraX/Y/Z` are set by input, `cameraX/Y/Z` are smoothly interpolated toward them each frame (panDamping=0.095, zoomDamping=0.15). GSAP handles focus transitions and overrides this lerp via `isTransitioning`.

- **`CardManager.js`** — infinite procedural chunk system. Divides 3D space into 50-unit chunks, maintains a `Set` of populated chunk keys (`"cx,cy,cz"`), and spawns 6–11 cards per chunk in a 5×5×5 grid around the camera each frame. Cards beyond 350 units from the camera are destroyed and their chunk key removed from `populatedChunks` so the space can repopulate when the camera revisits. Pending spawns (when the feed pool is empty) are queued and flushed on the next frame.

- **`Card.js`** — a single 3D card. Each card is a `THREE.Group` containing: a border backing plane, a main plate mesh, and optionally an info strip (for `api-image` type). Card content type determines the plate material: `api-image` async-loads a texture via `TextureLoader` (shows placeholder color until loaded); `image` loads synchronously; `text` renders to a `CanvasTexture` using the 2D canvas API. GSAP drives all hover scale/tilt and focus animations. `plateMesh.userData.parentCard` is set so raycasting can retrieve the Card instance from the intersected mesh.

### Services Layer (`src/services/`)

- **`DesignFeed.js`** — blends Unsplash and Pexels into a single shuffled pool. Maintains a `pool[]` array and prefetches (Fisher-Yates shuffled) when it drops below 50 items. `getNext()` pops from the front. Neither service is required — both keys are optional; the canvas falls back to local `inspirations.js` data when the pool is empty.

- **`UnsplashService.js`** / **`PexelsService.js`** — cycle through a fixed list of design-related queries, paginating through results and marking queries `exhausted` when pages run out (then resetting). Both normalize their API responses to the same card data shape: `{ id, imageUrl, thumbUrl, title, author, likes, source, sourceUrl, color, query, type: 'api-image' }`.

### React Layer (`src/`)

- **`App.jsx`** — holds `spaceSceneRef` and `designFeedRef` as refs (not state). Initializes the scene in `initScene()`, which is called once on mount (if keys exist) or after `ApiKeySetup` completes. Teardown via `spaceSceneRef.current.destroy()` on unmount or re-init.

- **`src/data/inspirations.js`** — 100 pre-generated local fallback cards (40% text quotes, 60% images) used when no API keys are configured or while the feed is loading.

### Styling

- Tailwind CSS v4 with `@import "tailwindcss"` in `src/index.css` (no `tailwind.config.js`).
- shadcn/ui configured with the `radix-rhea` style, `.jsx` (not `.tsx`), Remixicon icon library.
- Path alias `@/` resolves to `src/` — use `@/components/ui/button` etc.
- Custom fonts: `--font-sans` = Space Grotesk Variable; `--font-title` = Space Grotesk. Applied via `font-sans` and `font-title` Tailwind utilities.
- Custom utilities defined in `src/index.css`: `no-scrollbar`, `hud-glass`, `anim-pulse-border`.

## Key Conventions

**Card data shape** — three distinct types share the same pipeline:
- `type: 'api-image'` — from Unsplash/Pexels; has `imageUrl`, `source`, `sourceUrl`, `color`
- `type: 'image'` — user-inserted; has `url`
- `type: 'text'` — quote card; has `text`, `author`, `category`

**API keys** are stored in `localStorage` as `unsplash_key` and `pexels_key`. The setup screen (`ApiKeySetup.jsx`) is shown once on first visit; a "API Keys" button in the bottom-right clears localStorage and re-shows it.

**Three.js resource cleanup** — every `Card` must call `destroy()` to dispose geometries, materials, and textures. The `_destroyed` flag prevents texture callbacks from updating a removed card's material after async image loads complete.

**No state in Three.js classes** — Three.js classes never import React or hold React state. All UI sync flows through the `reactCallbacks` passed into `SpaceScene`.
