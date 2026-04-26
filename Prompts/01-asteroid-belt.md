# Prompt 1 — Asteroid Belt

Model the asteroid belt and show it in the Solar System view.

## What to do

Add an asteroid belt between Mars and Jupiter. It should appear as a band of small dots/particles distributed in a ring around the Sun, rendered on the Solar System canvas.

## Requirements

- Add asteroid belt data to `src/data/celestialBodies.ts` — define the inner and outer radius bounds (roughly 2.2–3.2 AU relative to the existing orbital scale), particle count, and visual properties (size, color, opacity)
- Add types for the asteroid belt in `src/types/index.ts`
- Render the belt in `src/renderers/solarSystemRenderer.ts` using the existing canvas drawing pattern — draw it before planets so it appears behind them; use small semi-transparent dots or short arcs distributed across the belt width
- Use a seeded deterministic RNG (the project already has Mulberry32) so the particle positions are stable across renders
- The belt should respect the existing zoom and pan transforms
- The belt should not be selectable or hoverable — it is a background visual element only
- Add it to the outliner as a non-interactive label if appropriate, or leave it out of the outliner entirely — your call

## Context

- The project uses HTML5 Canvas 2D with `requestAnimationFrame`
- Orbital radii in the canvas are NOT to real scale — they are chosen for visual clarity; place the belt visually between Mars and Jupiter in the existing scale
- The seeded RNG (Mulberry32) is already used for the star field in the renderer
- After making changes, run `npm test` to confirm all 27 existing tests still pass, then run `npm start` and verify the belt is visible in the browser
