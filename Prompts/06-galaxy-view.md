# Prompt 6 — Galaxy View

Add a new "Galaxy" tab showing a top-down view of the Milky Way with the Solar System and exosystems from Prompt 5 marked as points of interest.

## Current architecture

- **Tab system**: `src/App.tsx` uses `TabId = 'solar-system' | 'planet-view'` (from `src/types/components.ts`)
- **Canvas pattern**: each view is a `<canvas>`-based component with its own animation loop, camera (pan/zoom via refs), and hit-testing — follow the same pattern as `src/components/SolarSystemCanvas.tsx`
- **Renderer pattern**: pure canvas drawing functions in `src/renderers/` with no React dependency — follow `src/renderers/solarSystemRenderer.ts`
- **Simulation pattern**: stateful class or module in `src/simulation/` that owns positions and update logic
- **Types barrel**: `src/types/index.ts` re-exports everything from `bodies.ts`, `visual.ts`, `components.ts` — add new types there
- **RNG**: `src/utils/mulberry32.ts` (seeded, deterministic) — already used for asteroid belt and Kuiper Belt particle placement
- **Multi-system data**: after Prompt 5, each star system has a JSON file at `src/data/<systemId>.json` and a registry in `src/data/systems.ts` (see `StarSystemMeta`)

## What to do

### 1. Create a galaxy data file

Create `src/data/galaxy.json` (or `milkyway.json`) containing galactic positions and metadata for each known system:

```json
{
  "systems": [
    {
      "id": "sol",
      "galacticX": 0,
      "galacticY": 0,
      "galacticArmHint": "orion",
      "distanceFromCentreKly": 26.0
    },
    ...
  ]
}
```

Positions should be plausible:
- Solar System: ~26,000 light-years from galactic centre, in the Orion Arm
- Exosystems: use real galactic coordinates where known (from SIMBAD or NASA Exoplanet Archive); otherwise distribute within the Milky Way disc at their correct approximate distances from Earth

### 2. Create a galaxy loader

Create `src/data/galaxy.ts`:
```ts
import rawData from './galaxy.json';
export const GALAXY_DATA = rawData;
```

Add a new type to `src/types/` (e.g. `src/types/galaxy.ts`) and re-export from the barrel:

```ts
export interface GalacticSystemEntry {
  id: string;                  // matches StarSystemMeta.id from systems.ts
  galacticX: number;           // canvas-space x after projection
  galacticY: number;           // canvas-space y after projection
  galacticArmHint?: string;    // 'orion' | 'sagittarius' | 'perseus' | etc.
  distanceFromCentreKly: number;
}
```

### 3. Create the galaxy simulation

Create `src/simulation/galaxySimulation.ts`:
- Projects galactic coordinates to canvas positions (scale factor configurable)
- Owns hover and selection state for system markers
- Methods: `update(mousePos)` for hover detection, `selectSystem(id)`, `getMarkers()`

### 4. Create the galaxy renderer

Create `src/renderers/galaxyRenderer.ts` — pure canvas drawing functions:

- `drawGalaxyBackground(ctx, width, height, seed)` — stylised spiral Milky Way:
  - Bright central bulge (radial gradient)
  - Spiral arms as faint particle clouds using Mulberry32 RNG (deterministic, matches seeded belt approach)
  - Overall blue-white colour palette on a black background
- `drawSystemMarkers(ctx, markers, hoveredId, selectedId)` — glowing dot + label for each system:
  - Default: small white/gold dot
  - Hovered: slightly larger, highlighted label
  - Selected: pulsing glow ring (same style as the sun pulse in the Info Panel)

### 5. Create the galaxy canvas component

Create `src/components/GalaxyCanvas.tsx` — follows the same animation loop / camera / hit-testing pattern as `SolarSystemCanvas.tsx`:
- Scroll to zoom, drag to pan
- `onHoverSystem(id | null)` and `onSelectSystem(id)` callbacks
- On click: calls `onSelectSystem`, which switches to Solar System tab with that system loaded (uses the system selector from Prompt 5)

### 6. Wire up the new tab

Extend `TabId` in `src/types/components.ts`:
```ts
export type TabId = 'solar-system' | 'planet-view' | 'galaxy';
```

In `src/App.tsx`:
- Add a "Galaxy" tab button alongside "Solar System" and "Planet View"
- Render `<GalaxyCanvas>` when `activeTab === 'galaxy'`
- When a system marker is clicked in the Galaxy view, set `activeSystem` to that system's ID and switch `activeTab` to `'solar-system'`

Add CSS for the new tab in `src/App.css` or a dedicated `src/components/GalaxyCanvas.css`.

## Test requirements

Create `src/simulation/__tests__/galaxySimulation.test.ts`:
- All marker positions are finite numbers
- Every system ID in `GALAXY_DATA` matches a known system in the registry from `systems.ts`
- Hover state transitions work correctly (hovered ID updates, clears on null)
- Selection state transitions work correctly

Run `npm test` — all existing tests plus new ones must pass.

## Context

- Test runner: Vitest 2 with `globals: true`
- This is the most ambitious feature — plan the implementation in layers: data → renderer → simulation → component → tab wiring → tests
- The galaxy canvas does not need to be scientifically accurate, but positions should be internally consistent and plausible
- Clicking a system marker in the Galaxy view should behave identically to using the system selector (Prompt 5) to choose that system, then switch to the Solar System tab
- After implementing, run `npm start` and verify: Galaxy tab renders, spiral background visible, system markers labelled, hover/click works, clicking a marker loads that system in the Solar System tab
