# Prompt 6 — Galaxy View

Add a new "Galaxy" tab showing a top-down view of the Milky Way with the Solar System and nearby/within-galaxy exosystems marked as points of interest.

## Current architecture

- **Tab system**: `src/App.tsx` uses `TabId = 'solar-system' | 'planet-view'` (from `src/types/components.ts`)
- **Canvas pattern**: each view is a `<canvas>`-based component with its own animation loop, camera (pan/zoom via refs), and hit-testing — follow the same pattern as `src/components/SolarSystemCanvas.tsx`
- **Renderer pattern**: pure canvas drawing functions in `src/renderers/` with no React dependency — follow `src/renderers/solarSystemRenderer.ts`
- **Simulation pattern**: stateful class in `src/simulation/` that owns positions and update logic
- **Types barrel**: `src/types/index.ts` re-exports everything from `bodies.ts`, `visual.ts`, `components.ts` — add new types there
- **RNG**: Mulberry32 is defined inline in `src/renderers/solarSystemRenderer.ts` and `src/renderers/planetViewRenderer.ts`. Extract it to `src/utils/mulberry32.ts` as part of this task so the galaxy renderer can share it without duplication.
- **Multi-system data**: each star system has a JSON file at `src/data/systems/<systemId>.json`; `src/data/systems.ts` builds `STAR_SYSTEMS: StarSystemMeta[]` via `import.meta.glob`
- **`distanceFromEarth`**: already present on `StarSystemMeta` (in light-years) for all 16 systems — use this to derive galactic distance from Sol rather than duplicating it in galaxy.json
- **Body types**: `BodyType` enum includes `Star`, `Planet`, `DwarfPlanet`, `Moon`, `Asteroid`, `Belt`, `Companion`, `BlackHole`, `NeutronStar`, `Quasar`; `ROOT_BODY_TYPES` set identifies which are primary objects
- **Test runner**: Vitest 4.x with `globals: true`

## Systems (16 total)

Milky Way systems (plot on galaxy map):
- `sol` — Solar System, Orion Arm, ~26,000 ly from galactic centre
- `trappist1` — 40.7 ly from Sol, Aquarius
- `kepler90` — 2,545 ly from Sol, Cygnus
- `55cancri` — 41 ly from Sol, Cancer
- `hd10180` — 127 ly from Sol, Hydrus
- `tauceti` — 11.9 ly from Sol, Cetus
- `gliese667c` — 23.6 ly from Sol, Scorpius
- `kepler16` — 245 ly from Sol, Cygnus
- `alphacentauri` — 4.37 ly from Sol, Centaurus
- `sgrA` — Sagittarius A* black hole, galactic centre, ~26,000 ly from Sol
- `cygnusx1` — Cygnus X-1 black hole, 7,240 ly from Sol, Cygnus
- `lich` — PSR B1257+12 pulsar, 2,300 ly from Sol, Virgo
- `psr-j0437` — PSR J0437-4715 pulsar, 510 ly from Sol, Pictor

Extragalactic systems (do NOT plot on the Milky Way map — show in a separate "Beyond" sidebar or legend):
- `m87` — M87* supermassive black hole, 53.5 million ly (Virgo Cluster)
- `3c273` — 3C 273 quasar, 2.4 billion ly
- `ton618` — TON 618 quasar, 10.4 billion ly

## What to do

### 0. Extract mulberry32 to a shared utility

Create `src/utils/mulberry32.ts`:
```ts
export function mulberry32(seed: number): () => number {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

Remove the inline copies from `solarSystemRenderer.ts` and `planetViewRenderer.ts` and import from this utility instead. Verify all existing tests still pass.

### 1. Create a galaxy data file

Create `src/data/galaxy.json` containing galactic coordinates for each Milky Way system. Extragalactic systems (m87, 3c273, ton618) are intentionally omitted — they are handled separately.

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
    {
      "id": "sgrA",
      "galacticX": 0,
      "galacticY": -26000,
      "galacticArmHint": "core",
      "distanceFromCentreKly": 0
    }
  ]
}
```

Positions (`galacticX`, `galacticY`) are in light-years relative to Sol. Derive them from real galactic coordinates (SIMBAD or NASA Exoplanet Archive); for nearby systems use the known RA/Dec + distance from Earth to compute approximate Cartesian offsets projected onto the galactic plane.

### 2. Add galaxy types

Create `src/types/galaxy.ts`:

```ts
export interface GalacticSystemEntry {
  id: string;
  galacticX: number;
  galacticY: number;
  galacticArmHint?: string;
  distanceFromCentreKly: number;
}

export interface GalaxyData {
  systems: GalacticSystemEntry[];
}

export interface ExtragalacticSystem {
  id: string;
  distanceFromEarth: number;
}
```

Re-export from `src/types/index.ts`.

### 3. Create a galaxy loader

Create `src/data/galaxy.ts`:
```ts
import rawData from './galaxy.json';
import type { GalaxyData } from '../types';
export const GALAXY_DATA: GalaxyData = rawData;
```

Build a `EXTRAGALACTIC_IDS` constant (set of system IDs that are extragalactic) used by the galaxy canvas to show a special sidebar/legend entry instead of a map marker.

### 4. Create the galaxy simulation

Create `src/simulation/galaxySimulation.ts`:
- Accepts `GALAXY_DATA` and `STAR_SYSTEMS` at construction time
- Converts `galacticX`/`galacticY` (ly) to canvas coordinates via a configurable `lyPerPixel` scale
- Owns hover and selection state: `hoveredId: string | null`, `selectedId: string | null`
- Methods:
  - `getMarkers(canvasCx, canvasCy, panX, panY, zoom)` — returns array of `{id, name, type, cx, cy, starColor}` in canvas-space
  - `hitTest(worldX, worldY)` — returns closest system ID within a threshold, or null
  - `setHovered(id)`, `setSelected(id)`
- `type` on each marker should reflect the root body type (`star`, `black-hole`, `neutron-star`, `quasar`) so the renderer can draw them differently

### 5. Create the galaxy renderer

Create `src/renderers/galaxyRenderer.ts` — pure canvas drawing functions. Import `mulberry32` from `src/utils/mulberry32.ts`.

**`drawGalaxyBackground(ctx, width, height)`**
- Black background
- Bright central bulge: radial gradient centred at galactic centre canvas position
- Four spiral arms as deterministic particle clouds using Mulberry32 RNG (seed 77777)
- Overall blue-white/purple colour palette

**`drawSystemMarkers(ctx, markers, hoveredId, selectedId)`**
- Differentiate by root body type:
  - Star: gold/white dot
  - BlackHole: dark purple dot with orange-red glow ring
  - NeutronStar: bright blue-white sharp point
  - Quasar: should not appear here (extragalactic)
- Hovered: slightly larger, label visible
- Selected: pulsing glow ring (same style as sun-pulse in the Info Panel)
- Sol: always labelled; other labels only on hover/select

**`drawExtragalacticLegend(ctx, extragalacticSystems, selectedId)`**
- Small panel in a corner listing the extragalactic systems (M87*, 3C 273, TON 618) with their distances
- Clicking one selects/highlights it (handled via hit-test in the canvas component)

### 6. Create the galaxy canvas component

Create `src/components/GalaxyCanvas.tsx` — follows the same animation loop / camera / hit-testing pattern as `SolarSystemCanvas.tsx`:

```tsx
interface GalaxyCanvasProps {
  selectedSystem: string;
  onSelectSystem: (id: string) => void;
}
```

- Scroll to zoom, drag to pan (same ref pattern as SolarSystemCanvas)
- On click: calls `onSelectSystem(id)`, which in App.tsx switches `activeSystem` and `activeTab` to `'solar-system'`
- Hover: highlight marker and show label
- Show a "Click to explore" tooltip near the cursor when hovering a system

### 7. Wire up the new tab

Extend `TabId` in `src/types/components.ts`:
```ts
export type TabId = 'solar-system' | 'planet-view' | 'galaxy';
```

In `src/App.tsx`:
- Add a "Galaxy" tab button alongside "Solar System" and "Planet View"
- Render `<GalaxyCanvas>` when `activeTab === 'galaxy'`
- When `onSelectSystem` fires: set `activeSystem` to that ID and switch `activeTab` to `'solar-system'`
- "Planet View" tab should be disabled when `activeTab === 'galaxy'` (no planet selected)

Add CSS in `src/components/GalaxyCanvas.css`.

## Constellation feature (Task 14 preparation)

The upcoming constellation task shows groupings of stars as seen from Earth — this is a **sky-map/celestial-sphere** perspective, not the galaxy top-down view. These are different views.

**Data approach**: constellation membership should live in a separate `src/data/constellations.json` file, not as tags on individual system JSONs. Example shape:
```json
{
  "constellations": [
    {
      "id": "cygnus",
      "name": "Cygnus",
      "description": "The Swan — a prominent summer constellation in the northern sky.",
      "funFact": "Cygnus contains Cygnus X-1, one of the first identified black holes.",
      "systems": ["cygnusx1", "kepler16", "kepler90"]
    }
  ]
}
```

The `systems` array references IDs that already exist in `src/data/systems/`. No changes to individual system JSON files are needed. No tags on system bodies are needed.

**JSON is the right choice** for both galaxy and constellation data — no database needed. The data is static, small, build-time loaded, and already follows the `import.meta.glob` auto-discovery pattern.

## Test requirements

Create `src/simulation/__tests__/galaxySimulation.test.ts`:
- All marker positions (from `getMarkers`) are finite numbers
- Every system ID in `GALAXY_DATA` matches a known system ID in `STAR_SYSTEMS`
- Extragalactic IDs (m87, 3c273, ton618) are NOT in `GALAXY_DATA.systems`
- `hitTest` returns null when no systems are nearby
- `setHovered` / `setSelected` update state correctly

Run `npm test` — all existing tests (349) plus new ones must pass.

## Implementation order

1. Extract mulberry32 utility + fix imports + run tests
2. galaxy.json data file with accurate positions
3. Types + loader
4. GalaxySimulation class + tests
5. galaxyRenderer.ts
6. GalaxyCanvas.tsx + CSS
7. Tab wiring in App.tsx
8. Final test run + `npm start` smoke test

## Smoke test checklist

- Galaxy tab renders; spiral background visible
- 13 Milky Way system markers shown, correctly positioned relative to Sol
- Extragalactic systems listed in the legend panel (not on the map)
- Hover highlights a marker and shows its label
- Click on a marker → switches to Solar System tab with that system loaded
- Zoom and pan work (scroll, drag)
- All 349+ tests pass
