# Prompt 4 — Tests for the JSON Data Loader

Write a comprehensive test suite that validates the `sol.json` data file and its TypeScript loader. The tests should be written generically enough that the same helpers can later be used to validate any star-system JSON file loaded for the multi-system feature (Prompt 5).

## Current architecture

- **Data file**: `src/data/sol.json` — one JSON file containing three top-level keys:
  - `bodies`: `Record<string, CelestialBody>` — all celestial bodies keyed by ID
  - `hierarchy`: `HierarchyNode[]` — the tree structure used by the navigator
  - `visualConfig`: `VisualConfig` — display radii, belt configs, speed multipliers
- **Loader**: `src/data/celestialBodies.ts` — exports three named constants:
  ```ts
  export const CELESTIAL_BODIES: Record<string, CelestialBody>
  export const BODY_HIERARCHY: HierarchyNode[]
  export const VISUAL_CONFIG: VisualConfig
  ```
- **Types** (import from `'../types'` — the barrel re-exports everything):
  - `src/types/bodies.ts` — `BodyId`, `BodyType`, `CelestialBody`, `HierarchyNode`, `RingBand`
  - `src/types/visual.ts` — `BeltConfig`, `VisualConfig`, `Vec2`, `CanvasSize`, `PlanetViewLayout`

## What to do

Create `src/data/__tests__/celestialBodies.test.ts`. Import from the loader (`CELESTIAL_BODIES`, `BODY_HIERARCHY`, `VISUAL_CONFIG`) and validate the loaded data — not simulation logic (that is covered in the simulation tests).

## Tests to write

### Bodies — shape and required fields

- Every body has a non-empty string `id`, `name`, `type`, and `color`
- Every body's `type` is one of: `'star' | 'planet' | 'dwarf-planet' | 'moon' | 'asteroid' | 'belt'`
- Every body with a `parent` references an `id` that exists in `CELESTIAL_BODIES`
- No body references itself as its parent
- `diameter` and `distanceFromParent` are finite numbers ≥ 0
- `orbitalPeriod` and `rotationPeriod` are finite numbers (may be negative for retrograde)
- `eccentricity` is in range [0, 1)
- `inclination` is a finite number
- `moons` is a non-negative integer
- `description` and `funFact` are non-empty strings

### Bodies — type-specific rules

- Exactly one body has `type === 'star'` and `parent === null`
- All `planet` and `dwarf-planet` bodies have `parent === 'sun'` (or the star's ID)
- All `moon` bodies have a parent whose type is `'planet'`, `'dwarf-planet'`, or `'asteroid'`
- All `belt` bodies have `orbitalPeriod === 0`
- At least one body of each type (`star`, `planet`, `dwarf-planet`, `moon`, `asteroid`, `belt`) is present

### Bodies — optional fields

- Where present, `nasaUrl` and `wikipediaUrl` are strings that start with `'https://'`
- Where present, `rings` is a non-empty array where each `RingBand` has:
  - `innerFactor` and `outerFactor` are positive numbers with `outerFactor > innerFactor`
  - `intensity` is in range (0, 1]
  - `color` is a non-empty string
- Where present, `binaryMassFraction` is in range (0, 1)

### Hierarchy

- `BODY_HIERARCHY` is a non-empty array
- Every `id` in the hierarchy tree exists in `CELESTIAL_BODIES`
- Every body in `CELESTIAL_BODIES` appears exactly once in the hierarchy tree (write a helper that flattens the tree)
- The root nodes of the hierarchy are not moons (depth 0 should contain star and belt nodes only)

### VisualConfig

- `orbitalRadii` contains an entry for every `planet` and `dwarf-planet` in `CELESTIAL_BODIES`, and each value is a positive number
- `planetSizes` contains entries for every non-belt body; each value is a positive number
- `moonOrbitalRadii` contains an entry for every `moon` body; each value is a positive number
- `speedMultiplier` and `moonSpeedMultiplier` are positive numbers
- `beltConfigs` contains an entry for every body with `type === 'belt'`; each config has positive `innerRadius`, `outerRadius`, `particleCount`, and `seed`, with `outerRadius > innerRadius`

### Cross-consistency

- Every key in `orbitalRadii` matches a body ID in `CELESTIAL_BODIES`
- Every key in `moonOrbitalRadii` matches a body ID in `CELESTIAL_BODIES`
- Every key in `beltConfigs` matches a body ID in `CELESTIAL_BODIES`

## Design note — write for reuse

Structure the tests using helper functions (e.g. `validateBodyShape(body)`, `validateRingBand(band)`, `flattenHierarchy(nodes)`) at the top of the file. These helpers will be extracted and reused in Prompt 5 to validate each exosystem's JSON before loading it into the simulation.

## Context

- Test runner: Vitest 2 with `globals: true` — no need to import `describe`, `it`, or `expect`
- Use the existing tests in `src/simulation/__tests__/` as a style reference
- After writing the tests, run `npm test` — all existing 27 tests plus your new ones must pass
