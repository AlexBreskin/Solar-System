# Refactor simulation code to reduce Cyclomatic Complexity, then maximise test coverage

You are working in `e:\Code\Other\Solar-System`. The codebase uses Vitest with `@vitest/coverage-v8`. Run tests with `npm test -- --run` and coverage with `npm test -- --run --coverage`.

## What to do

### Step 1 — Refactor `SolarSystemSimulation.updatePositions` (Option A + C)

File: `src/simulation/solarSystemSimulation.ts`

Extract three private helpers:

1. **`private resolveOrbitCentre(planetId: string, cx: number, cy: number, pos: Record<string, Vec2>): Vec2`** — replaces the compound `parentBody && !ROOT_BODY_TYPES.has(parentBody.type) && pos[parentId!] ? ... : ...` expression in step 4.

2. **`private placeOrbiting(pos: Record<string, Vec2>, id: string): void`** — handles the shared orbit-placement math used in both step 2 (non-binary companions whose parent is in fixedSet) and step 5 (non-binary moons of planets). Guard: if `parentId` is missing or `pos[parentId]` is not yet set, return without placing.

3. **`private placeBinary(pos: Record<string, Vec2>, id: string): void`** — handles the shared binary-displacement math used in both step 3 (binary companions) and step 6 (binary moons of planets). Guard: skip if `pos[id]` is already set or `parentId` is missing.

Replace the inline logic in `updatePositions` with calls to these helpers. The six-pass structure and the step comments must be preserved. No behaviour change — all existing tests must still pass.

### Step 2 — Split `computeScaledLayout` (Option E)

File: `src/simulation/planetViewSimulation.ts`

Extract two internal (non-exported) functions:

1. **`computeBodySizes(planetId: string, moons: string[], canvasW: number, canvasH: number, bodies: Record<string, CelestialBody>): { planetR: number; moonSizes: Record<string, number> }`** — contains the `planetR` and `moonSizes` calculation.

2. **`computeOrbitalRadii(moons: string[], bodies: Record<string, CelestialBody>, planetR: number, FIT_RADIUS: number): Record<string, number>`** — contains the sorting, spacing, gap-enforcement, and scale-down logic. Returns early with `{}` if `moons.length === 0`.

The public `computeScaledLayout` function becomes a thin wrapper that calls both and assembles the result. Its signature is unchanged. All existing tests must still pass.

### Step 3 — Run tests to confirm no regressions

```
npm test -- --run
```

All tests must pass before continuing.

### Step 4 — Run coverage report

```
npm test -- --run --coverage
```

Identify every uncovered branch and statement in:

- `src/simulation/solarSystemSimulation.ts`
- `src/simulation/planetViewSimulation.ts`
- `src/simulation/galaxySimulation.ts`
- `src/utils/distance.ts`

### Step 5 — Write tests to close coverage gaps

Add tests to the existing test files:

- `src/simulation/__tests__/solarSystemSimulation.test.ts`
- `src/simulation/__tests__/planetViewSimulation.test.ts`
- `src/simulation/__tests__/galaxySimulation.test.ts`
- `src/utils/__tests__/distance.test.ts` (create if it does not exist)

For each uncovered branch, write the minimum test that exercises it. Do not pad with redundant tests. Target: 100% branch coverage on all four files. If a branch is provably unreachable given the type contracts (i.e. it only exists because TypeScript cannot narrow a type), remove it rather than writing a contorted test for it.

### Step 6 — Run coverage again to verify

```
npm test -- --run --coverage
```

Confirm that branch coverage on the four target files reaches 100% (or document any remaining gap with a one-line explanation of why it is unreachable).

### Step 7 — Cypress smoke test (requires user action)

Stop here. Ask the user to run the following command in their terminal and wait for them to confirm the result before continuing:

```
npx start-server-and-test 'npm start' http://localhost:5173/Solar-System/ 'npm run cypress:run'
```

This starts the Vite dev server, waits for it to be ready, runs the full Cypress suite headlessly, then kills the server. All 8 test files must pass. The existing Cypress suite exercises tab switching (System View, Body View, Galaxy), body selection, info panel updates, speed controls, galaxy view interaction, and zoom controls — enough to catch any simulation regression that surfaces as a broken UI or rendering failure.

Do not proceed to the README update until the user confirms all Cypress tests pass.

### Step 8 — Update README

The README tracks architecture and test coverage. Update it to reflect the refactor and the final coverage state.

---

## Out of scope for this prompt — renderer and component violations

Running `npm run lint` after the simulation refactor will still show warnings in the renderer and component layers. These are documented here for a future prompt.

### Renderers (`src/renderers/`)

| File                     | Function               | CC  |
| ------------------------ | ---------------------- | --- |
| `solarSystemRenderer.ts` | `drawBodies`           | 37  |
| `planetViewRenderer.ts`  | `drawBody`             | 21  |
| `galaxyRenderer.ts`      | `drawSystemMarkers`    | 23  |
| `galaxyRenderer.ts`      | `drawViewportStars`    | 15  |
| `galaxyRenderer.ts`      | `drawRegionLabels`     | 15  |
| `solarSystemRenderer.ts` | `drawBelt`             | 18  |
| `galaxyRenderer.ts`      | `getLOD0Particles`     | 14  |
| `galaxyRenderer.ts`      | `drawGalaxyBackground` | 14  |
| `solarSystemRenderer.ts` | `drawOrbits`           | 11  |
| `galaxyRenderer.ts`      | `getLOD1Particles`     | 11  |

Renderer functions are high-CC by nature — they branch on body type, LOD level, ring presence, label visibility, etc. Refactoring options include: extracting per-body-type draw helpers, splitting LOD paths into separate functions, and pulling label-layout logic out of the render loop.

### Components (`src/components/` and `src/App.tsx`)

| File                    | Function            | CC  |
| ----------------------- | ------------------- | --- |
| `App.tsx`               | `App`               | 28  |
| `GalaxySystemPanel.tsx` | `GalaxySystemPanel` | 25  |
| `PlanetViewCanvas.tsx`  | `draw`              | 25  |
| `InfoPanel.tsx`         | `InfoPanel`         | 19  |
| `BodyNavigator.tsx`     | `NavigatorNode`     | 15  |
| `SolarSystemCanvas.tsx` | arrow function      | 13  |

Large React components accumulate CC from conditional rendering, event handlers, and derived state. Refactoring options include: splitting render sections into sub-components, extracting event handler logic into custom hooks, and moving conditional display logic into helper functions.
