# Prompt 5 — Multiple Solar Systems

Research and implement data for 6 additional real exoplanetary systems, then add a system selector so the user can switch between them.

## Current architecture

- **Data format**: `src/data/sol.json` — one JSON file with three top-level keys:
  - `bodies`: `Record<string, CelestialBody>` — all celestial bodies keyed by ID
  - `hierarchy`: `HierarchyNode[]` — the tree structure used by the navigator outliner
  - `visualConfig`: `VisualConfig` — display radii, belt configs, speed multipliers
- **Loader**: `src/data/celestialBodies.ts` — imports `sol.json` at module level and re-exports three named constants:
  ```ts
  export const CELESTIAL_BODIES: Record<string, CelestialBody>
  export const BODY_HIERARCHY: HierarchyNode[]
  export const VISUAL_CONFIG: VisualConfig
  ```
- **Types** (import from `'../types'` — barrel re-exports everything):
  - `src/types/bodies.ts` — `BodyId`, `BodyType`, `CelestialBody`, `HierarchyNode`, `RingBand`
  - `src/types/visual.ts` — `BeltConfig`, `VisualConfig`, `Vec2`, `CanvasSize`, `PlanetViewLayout`
  - `src/types/components.ts` — `TabId`, canvas prop/state interfaces, `InfoPanelProps`, `StatRowProps`
  - `src/types/index.ts` — barrel re-export of all the above
- **Simulations**: `src/simulation/solarSystemSimulation.ts` and `src/simulation/planetViewSimulation.ts` — both currently import `CELESTIAL_BODIES` and `VISUAL_CONFIG` at module level (hardcoded to Sol)
- **App tab structure**: `src/App.tsx` uses `TabId = 'solar-system' | 'planet-view'`

## What to do

### 1. Research 6 exoplanetary systems

Good candidates with well-documented confirmed planets:
- TRAPPIST-1 (7 confirmed planets, tight orbits)
- Kepler-90 (8 confirmed planets — most in any known system)
- 55 Cancri (5 confirmed planets, wide range of types)
- HD 10180 (up to 9 candidate planets)
- Tau Ceti (4 confirmed candidates)
- Gliese 667C (3 confirmed planets in habitable zone)

For each system, model:
- Host star: name, spectral type, radius relative to Sun (use `diameter` in km), luminosity/color, fun fact, description
- Confirmed planets: name, orbital period (days), semi-major axis (AU → `distanceFromParent`), estimated radius (`diameter` in km), color, description, fun fact
- Moons are optional — omit if data is sparse
- Belts are optional — omit unless well-documented

### 2. Create per-system JSON files

Create one JSON file per exosystem at `src/data/<systemId>.json`, each following the **same schema** as `sol.json`:

```json
{
  "bodies": { "<id>": { ...CelestialBody } },
  "hierarchy": [ { "id": "<id>", "children": [...] } ],
  "visualConfig": {
    "orbitalRadii": { "<id>": number },
    "planetSizes": { "<id>": number },
    "moonOrbitalRadii": {},
    "speedMultiplier": number,
    "moonSpeedMultiplier": number,
    "beltConfigs": {}
  }
}
```

Body IDs should be namespaced to avoid collisions (e.g. `trappist1-star`, `trappist1-b`).

Visual scale does not need to match real AU distances — use "chosen for clarity" spacing as in the Sol system.

### 3. Create a system registry

Create `src/data/systems.ts` that lists all available systems:

```ts
export interface StarSystemMeta {
  id: string;
  name: string;
  description: string;
  starColor: string;
}

export const STAR_SYSTEMS: StarSystemMeta[] = [
  { id: 'sol', name: 'Solar System', description: '...', starColor: '#FFF5C0' },
  { id: 'trappist1', name: 'TRAPPIST-1', description: '...', starColor: '#FF6040' },
  // ...
];
```

### 4. Refactor the loader to be system-agnostic

Refactor `src/data/celestialBodies.ts` from a static module-level import to a dynamic loader:

```ts
export async function loadStarSystem(id: string): Promise<{
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
}>
```

Or use Vite's `import()` for dynamic JSON loading. The simulations (`SolarSystemSimulation`, `PlanetViewSimulation`) must be refactored to accept `bodies` and `visualConfig` as constructor/init arguments rather than importing them at module level.

### 5. Add a system selector UI

Add a system selector — a pill strip or dropdown — accessible from the Solar System view (e.g. in the header or toolbar). On switch:
- Load the new system's data
- Reset camera (pan to origin, zoom to default)
- Clear any selection and tracking state
- The currently selected system name should be visible at all times

The outliner, info panel, and planet view should all work correctly for whichever system is active.

## New types to add

Add to `src/types/bodies.ts` (or a new `src/types/systems.ts`):

```ts
export interface StarSystem {
  id: string;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
}
```

Export from the barrel `src/types/index.ts`.

## Test requirements

- Validate each new exosystem JSON using the same helper functions from `src/data/__tests__/celestialBodies.test.ts` (see Prompt 4) — those helpers were designed for exactly this reuse
- Add a test file `src/data/__tests__/exosystems.test.ts` that iterates over all system IDs, loads each JSON, and runs the shared validators
- Run `npm test` — all existing tests plus new ones must pass

## Context

- Test runner: Vitest 2 with `globals: true`
- Vite supports `import('./sol.json', { assert: { type: 'json' } })` for dynamic JSON imports
- The app currently has a single hardcoded system; this is the first step toward the multi-system architecture needed for the Galaxy view in Prompt 6
- Exoplanet data sources: NASA Exoplanet Archive (exoplanetarchive.ipac.caltech.edu), exoplanet.eu, or Wikipedia confirmed planet tables
