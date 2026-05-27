# Reduce Cyclomatic Complexity in renderer layer

You are working in `e:\Code\Other\Solar-System`. ESLint is configured with `"complexity": ["warn", { max: 10 }]` — run `npm run lint` to check progress. Run tests with `npm test -- --run` after each file to catch regressions.

The simulation layer has already been refactored (see `Prompts/09-cyclomatic-complexity-refactor.md`). This prompt targets the renderer layer only. Do not touch simulation files.

Renderers draw to a `CanvasRenderingContext2D` — they are not unit-testable. Do not write tests for renderer functions. Run `npm test -- --run` after each file only to confirm no simulation or data tests regressed.

---

## Priority 1 — `src/renderers/solarSystemRenderer.ts`

### `drawBodies` (CC 37) — split into three pass functions

`drawBodies` runs three sequential loops over all bodies. Extract each as a private-style (non-exported) function:

**`drawBodyGlows(ctx, bodies, positions, selectedBody, hoveredBody, planetSizes)`**
Contains the first loop (lines ~298–322): skips belts, draws radial-gradient glow for selected/hovered bodies only.

**`drawMoonOrbitRings(ctx, bodies, positions, moonOrbitalRadii, showOrbits)`**
Contains the second loop (lines ~325–337): skips non-moon/companion types, draws faint orbit circles around each moon's parent.

**`drawBodyShapes(ctx, bodies, positions, selectedBody, hoveredBody, showLabels, planetSizes)`**
Contains the third loop (lines ~340–408): skips belts, dispatches to `drawSun`/`drawBlackHole` for root types, draws gradient sphere for everything else. Extract the gradient-sphere branch (the `else` block) into:

**`drawGenericBody(ctx, body, pos, r, isSelected, isHovered)`**
Handles: gradient sphere fill, `isSelected` dashed-ring overlay, `isHovered` ring overlay, `atmosphereColor` stroke. CC should be ~8.

`drawBodies` itself becomes four calls: `drawBodyGlows`, `drawMoonOrbitRings`, `drawBodyShapes` (which calls `drawGenericBody`). Target CC for `drawBodies`: ≤ 4.

### `drawBelt` (CC 18) — split rendering paths

Extract:

**`drawBeltHighlight(ctx, cx, cy, midRadius, ringWidth, body, isSelected, isHovered)`**
The `if (isSelected || isHovered)` block (lines ~99–107).

**`drawBeltParticles(ctx, cx, cy, beltId, color, isSelected, isHovered, visualConfig)`**
The `else` branch of the `if (zoom < 0.7)` block (lines ~117–130).

`drawBelt` calls these helpers and retains the low-zoom ring fallback and label drawing inline. Target CC: ≤ 8.

---

## Priority 2 — `src/renderers/planetViewRenderer.ts`

### `drawBody` (CC 21) — split into rendering phases

Extract four helpers (none exported):

**`drawBodyAura(ctx, body, x, y, r, isSelected, isHovered)`**
Phase 1 (lines ~57–80): selected/hovered radial glow, then root-body corona for non-black-holes. CC ~5.

**`drawBodyShape(ctx, body, x, y, r)`**
Phase 2 (lines ~82–117): black hole accretion disk + dark fill, OR gradient sphere (star vs planet colours). CC ~5.

**`drawBodyOverlays(ctx, body, x, y, r, isSelected, isHovered)`**
Phase 3 (lines ~119–146): atmosphere stroke, selected dashed ring, hovered ring. CC ~5.

`drawBody` calls these three helpers then handles the label inline. Target CC for `drawBody`: ≤ 6.

---

## Priority 3 — `src/renderers/galaxyRenderer.ts`

### `drawSystemMarkers` (CC 23)

**Step 1 — Extract `markerRadius(isLocal, isGalaxyScale, isSol): number`**
Replaces the triple-nested ternary for `baseR`. Use a flat if/else-if chain or a lookup — no nested ternaries. CC contribution removed: 4.

**Step 2 — Extract `drawMarkerGlow(ctx, mx, my, r, m, ts, isSelected, isHovered): void`**
The `if (isSelected) { ... } else if (isHovered) { ... }` glow block (lines ~817–836).

**Step 3 — Extract `drawMarkerLabel(ctx, m, mx, my, r, isLocal, isSelected): void`**
The label block at the end of the loop (lines ~856–876): handles both the local-mode (name + distance) and normal-mode (name only) cases.

`drawSystemMarkers` loop body becomes: compute `baseR`/`r`, call `drawMarkerGlow`, draw bitmap, draw selection ring, call `drawMarkerLabel`. Target CC: ≤ 10.

### `drawGalaxyBackground` (CC 14)

**Extract `drawGalacticBar(ctx, gcx, gcy, scale, barFade): void`**
The entire `if (barFade > 0)` block (lines ~608–672): Long Bar, Galactic Bar, compact nucleus. This is self-contained and accounts for roughly 5 CC points.

Target CC for `drawGalaxyBackground`: ≤ 10.

### `drawViewportStars` (CC 15)

**Extract `starPixelSize(largeStars: boolean, sizeRaw: number): number`**
Replaces the 3-level nested ternary for `size` (lines ~489–495). A flat if/else-if returning 1, 1.5, or 2 is clearer and removes 2 CC points.

Target CC for `drawViewportStars`: ≤ 12. (The tile double-loop with bounds guards is structurally necessary — further reduction would harm readability.)

### `drawRegionLabels` (CC 15)

**Extract `drawSingleRegionLabel(ctx, region, sx, sy, isHovered, isSelected, a): void`**
The per-region drawing block inside the `for` loop: pill background, optional border stroke, text fill. `drawRegionLabels` retains the early-return guards, fade calculation, and the loop itself. Target CC for `drawRegionLabels`: ≤ 8.

### `getLOD0Particles` / `getLOD1Particles` (CC 14 / 11) — lowest priority

Both functions generate multiple particle populations using the same `for (const off of [...]) { for (let i ...) {} }` nested pattern for major arms, minor arms, and spurs.

Extract **`generateArmParticles(rng, p, offsets, count, maxR, alphaMid, alphaRange)`** that encapsulates the double loop + scatter + `aScale` + `dv` logic. The bulge and disk sections remain inline as they have distinct geometry.

Only tackle this if the higher-priority items are complete and `npm run lint` still shows warnings for these functions.

---

## Completion criteria

Run `npm run lint` when done. The following functions must no longer appear in the output:

- `drawBodies`
- `drawBelt`
- `drawBody` (planetViewRenderer)
- `drawSystemMarkers`
- `drawGalaxyBackground`
- `drawRegionLabels`
- `drawViewportStars`

Remaining acceptable warnings (if any): `getLOD0Particles`, `getLOD1Particles`.

Run `npm test -- --run` one final time to confirm zero test regressions.

### Cypress smoke test (requires user action)

Stop here. Ask the user to run the following command in their terminal and wait for them to confirm the result before continuing:

```
npx start-server-and-test 'npm start' http://localhost:5173/Solar-System/ 'npm run cypress:run'
```

This starts the Vite dev server, waits for it to be ready, runs the full Cypress suite headlessly, then kills the server. All 8 test files must pass. Since renderers cannot be unit-tested, the Cypress suite is the only automated verification that refactored rendering code still produces correct output. The tests exercise all three renderer paths — System View (solarSystemRenderer), Body View (planetViewRenderer), and Galaxy (galaxyRenderer) — through real tab switching and body interaction.

Do not update the README until the user confirms all Cypress tests pass.

Update the README to note the renderer refactor.
