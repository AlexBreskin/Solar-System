# Prompt 12 — Galactic Region Highlighting (Spiral Band Model)

## Goal

Implement clickable galactic region highlighting on the galaxy map. When a user clicks anywhere within a galactic region (spiral arm, spur, or galactic core), the entire region is highlighted with a semi-transparent coloured overlay. Replace the existing label-proximity-only hit-test with shape-aware containment checks. Keep cyclomatic complexity ≤ 5 per function and extract all new logic into focused helper files.

Exclude the Galactic Halo region from shape-based highlighting — it projects poorly onto the 2D top-down map. Its label should remain visible but it gets no shape overlay.

---

## Background: Coordinate Systems

Two coordinate systems are in play:

- **World coordinates (Sol-centric)**: Sol at `(0, 0)`. Galactic centre at `(0, -26000)` ly. All `galacticX/galacticY` values in `galaxy.json` and `GalacticSystemEntry` use this system.
- **Galactocentric coordinates**: Origin at galactic centre. The existing arm guides in `galaxyRenderer.ts` use galactocentric coords: `point = [r * cos(θ), -r * sin(θ)]`.

Convert galactocentric → world by adding `(0, -26000)`:

```
worldX = galactocentricX
worldY = galactocentricY - 26000
```

All new geometry helpers must work in **world coordinates** to be compatible with hit-testing in `GalaxySimulation`.

---

## New Data Model

### 1. Add `RegionShape` type to `src/types/galaxy.ts`

```typescript
export type SpiralBandShape = {
  type: "spiralBand";
  armOffset: number; // Matches one of the offsets in armGuideConfigs
  halfWidthInner: number; // ly inward from centreline toward galactic centre
  halfWidthOuter: number; // ly outward from centreline away from galactic centre
  tStart: number; // Start of t parameter range (matches spiral formula)
  tEnd: number; // End of t parameter range
};

export type EllipseShape = {
  type: "ellipse";
  cx: number; // World X centre (ly)
  cy: number; // World Y centre (ly)
  rx: number; // Semi-axis along local x (ly)
  ry: number; // Semi-axis along local y (ly)
  angleRad: number; // Counter-clockwise rotation in radians
};

export type RegionShape = SpiralBandShape | EllipseShape;
```

### 2. Extend `GalaxyRegion` in `src/types/galaxy.ts`

```typescript
export interface GalaxyRegion {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  color: string;
  description: string;
  funFact: string;
  wikipediaUrl?: string;
  shape?: RegionShape; // New: absent for halo
}
```

### 3. Add `shape` to each region in `src/data/galaxy.json`

Use the spiral formula `r = 2000 × exp(0.22 × t)` with galactocentric coordinates, then convert to world coords.

**Calibration method**: For each named arm, find the `armOffset` from `armGuideConfigs` whose centreline passes closest to the star systems with the matching `galacticArmHint`. The existing system positions in `galaxy.json` (with their `galacticArmHint` values) are your ground truth. For example, systems hinted `"norma"` should fall within the Norma arm's spiral band.

The 4 major arm offsets are `0`, `π/2`, `π`, `3π/2`. The secondary offsets `π/4` and `π + π/4` correspond to Norma and Outer arm (which are less prominent). Use whichever offset minimises the average distance from labelled systems to the arm centreline.

Assign shapes as follows:

| Region id     | Shape type   | Notes                                                                                                           |
| ------------- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| `orion`       | `ellipse`    | Rotated ~15° from galactic plane; roughly 5,000 × 2,000 ly centred near Sol                                     |
| `sagittarius` | `spiralBand` | Major inner arm; calibrate to systems hinted `"sagittarius"`                                                    |
| `perseus`     | `spiralBand` | Major outer arm; calibrate to systems hinted `"perseus"`                                                        |
| `scutum`      | `spiralBand` | Innermost of the outer-region major arms; calibrate to `"scutum"` systems                                       |
| `norma`       | `spiralBand` | Inner arm; calibrate to `"norma"` systems (GRO J1655-40, Circinus X-1)                                          |
| `outer`       | `spiralBand` | Outermost arm; calibrate to `"outer"` if systems present, else use expected offset                              |
| `core`        | `ellipse`    | Centred at world `(0, -26000)`; rx/ry ~3000/2000 ly; `angleRad: Math.PI * 55 / 180` to match galactic bar angle |
| `halo`        | _(none)_     | Omit `shape` entirely                                                                                           |

Typical half-width values: major spiral arms ~2500 ly inner / 3500 ly outer; Norma/Outer ~1500/2500 ly.

---

## New Files to Create

### `src/utils/spiralGeometry.ts`

Pure functions, no imports from React or canvas. Every function CC ≤ 5.

```typescript
// Spiral constants (must match galaxyRenderer.ts)
export const SPIRAL_A = 2000;
export const SPIRAL_B = 0.22;
export const SPIRAL_T_START = 0.4;
export const SPIRAL_T_END = /* max t before r > 52000 */ ... ;
export const GALACTIC_CENTRE_WORLD_Y = -26000;

/** Point on spiral in WORLD coordinates at parameter t, with given armOffset. */
export function spiralWorldPoint(t: number, armOffset: number): [number, number];

/**
 * Nearest t value on the spiral to world point (px, py).
 * Uses golden-section search over [tStart, tEnd].
 * Returns the t that minimises distance to (px, py).
 */
export function nearestSpiralT(
  px: number, py: number,
  armOffset: number,
  tStart: number,
  tEnd: number,
): number;

/** Signed distance from world point (px, py) to spiral centreline. Negative = inside. */
export function distanceToSpiral(
  px: number, py: number,
  armOffset: number,
  tStart: number,
  tEnd: number,
): number;

/** True if (px, py) lies within a spiral band (between inner and outer radii of centreline). */
export function pointInSpiralBand(px: number, py: number, shape: SpiralBandShape): boolean;

/** True if (px, py) lies within a (possibly rotated) ellipse. */
export function pointInEllipse(px: number, py: number, shape: EllipseShape): boolean;

/** Dispatch: true if (px, py) lies within the region shape. */
export function pointInRegionShape(px: number, py: number, shape: RegionShape): boolean;
```

Implementation notes:

- `spiralWorldPoint`: `r = SPIRAL_A * exp(SPIRAL_B * t)`, theta = `t + armOffset`, then `x = r * cos(theta)`, `y = -r * sin(theta) - 26000`.
- `nearestSpiralT`: golden-section search with ~30 iterations is sufficient for the accuracy required.
- `pointInSpiralBand`: compute `d = distanceToSpiral(...)` then check `d >= -halfWidthInner && d <= halfWidthOuter`. The sign convention: positive d = outward from galactic centre, negative = inward.
- `pointInEllipse`: rotate point into ellipse frame, apply standard `((x/rx)² + (y/ry)²) ≤ 1` test.

### `src/renderers/galaxy-view/galaxyRegionHighlight.ts`

Renders the highlight overlay for a selected region. Every function CC ≤ 5.

```typescript
/**
 * Draw a semi-transparent coloured overlay for the given region's shape
 * onto ctx. gcx/gcy is the galactic-centre canvas position; scale is px/ly.
 *
 * Must be called after background rendering and before marker rendering.
 * Does nothing if region.shape is absent (halo).
 */
export function drawRegionHighlight(
  ctx: CanvasRenderingContext2D,
  region: GalaxyRegion,
  gcx: number, // canvas X of galactic centre
  gcy: number, // canvas Y of galactic centre
  scale: number, // pixels per ly
  panX: number,
  panY: number,
): void;
```

Internal helpers (all private, all CC ≤ 5):

- `drawSpiralBandHighlight(ctx, shape, color, gcx, gcy, scale, panX, panY)`: generate two offset curve paths (inner boundary = centreline shifted inward by `halfWidthInner`, outer boundary = centreline shifted outward by `halfWidthOuter`), fill the region between them. Use the normal-to-tangent offset method: at each spiral point compute the unit tangent, rotate 90°, and displace.
- `drawEllipseHighlight(ctx, shape, color, gcx, gcy, scale, panX, panY)`: `ctx.ellipse(...)` with appropriate transforms.

Visual style:

- Fill: `region.color` at alpha 0.22
- Stroke (edge glow): `region.color` at alpha 0.55, lineWidth 2 canvas pixels
- Use `ctx.save()`/`ctx.restore()` around each draw call

---

## Modifications to Existing Files

### `src/utils/spiralGeometry.ts` ← export `SPIRAL_T_END`

Calculate and export `SPIRAL_T_END` so both `galaxyRenderer.ts` and `spiralGeometry.ts` use the same maximum t. Currently `galaxyRenderer.ts` has `if (r > 52000) break;` inline — extract this as a named constant.

### `src/simulation/galaxySimulation.ts` — shape-aware hit-test

Replace `hitTestRegion` with a two-stage check:

1. Try shape containment first using `pointInRegionShape` from `spiralGeometry.ts`; return the first matching region. (Iterate in reverse display order so inner regions win over outer ones when they overlap.)
2. Fall back to the existing label-proximity check (48 ly threshold) for the halo (which has no shape) and as a backstop for clicking directly on a label.

Keep `hitTest` (marker hit-test) unchanged.

### `src/renderers/galaxy-view/galaxyRenderer.ts`

1. Add a call to `drawRegionHighlight(...)` in the main draw function, after `drawArmGuides` and before `drawViewportStars` / LOD particles. Pass `selectedRegion: GalaxyRegion | null` as a parameter.
2. Extract the inline `if (r > 52000) break` limit to use the shared `SPIRAL_T_END` constant from `spiralGeometry.ts` so both files stay in sync.
3. If any existing function exceeds CC 5 after your changes, extract the branch into a named helper before committing.

### `src/renderers/galaxy-view/galaxyRegions.ts`

No structural changes required — label rendering stays here. If any function now has CC > 5 due to the shape-aware state, extract a helper.

### `GalaxyCanvas.tsx` (or wherever `hitTestRegion` is called)

Update the call site to pass the world coordinate of the click, and handle the updated `hitTestRegion` signature if it changes. Ensure region selection toggles off when clicking the same region again (existing behaviour).

---

## Cyclomatic Complexity Rules

Apply these rules to **all touched files** (not just new code):

1. Maximum CC of **10** per function. (CC = 1 + number of `if`/`else if`/`case`/`&&`/`||`/`?`/`while`/`for`/`catch` branch points.)
2. Any function longer than **40 lines** is a candidate for extraction regardless of CC.
3. A `switch` with > 4 cases must be replaced by a dispatch table or extracted helper.
4. No nested ternaries.
5. Run `npx eslint --rule '{"complexity": ["error", 10]}' src/` after implementation to verify; fix any violations before marking done.

---

## Testing Requirements

### Unit tests — `src/utils/__tests__/spiralGeometry.test.ts`

Write tests covering:

- `spiralWorldPoint`: known t/offset values produce expected x/y (check formula correctness)
- `nearestSpiralT`: point on the spiral returns its own t within tolerance
- `pointInSpiralBand`: point clearly inside → true; point clearly outside → false; point exactly on boundary → consistent
- `pointInEllipse`: centre → true; point at rx on major axis → on-boundary; point beyond → false
- `pointInRegionShape`: dispatches correctly to both types

### Integration — `GalaxySimulation.hitTestRegion`

Add tests in `src/simulation/__tests__/galaxySimulation.test.ts`:

- A world coordinate known to lie inside a spiral band returns the correct region
- A world coordinate outside all shapes but near a label still returns the label's region (fallback)
- Halo region is only reachable via label proximity, not shape containment

### Run `npm test` — all existing tests must continue to pass.

---

## Out of Scope

- Animated highlight transitions (fade-in/out): the overlay appears/disappears on click without animation in this iteration.
- Highlighting systems within a region: the overlay is a geometric band, not system-specific.
- Changing the Galactic Halo's behaviour beyond the label fallback.
- Any changes to the outliner/info panel for region detail display.
