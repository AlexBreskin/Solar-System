# Prompt 6 — Galaxy View

Add a new "Galaxy" tab showing a top-down view of the Milky Way with the Solar System and exosystems from Prompt 5 marked as points of interest.

## What to do

Add a third top-level tab ("Galaxy") alongside the existing "Solar System" and "Planet View" tabs. This view renders a stylised top-down Milky Way with labelled markers for our Solar System and each of the 6 exosystems added in Prompt 5.

## Visual requirements

- Render a stylised spiral galaxy (Milky Way approximation) on an HTML5 Canvas — spiral arms as faint particle clouds or arc bands, a bright central bulge, overall blue-white colour palette on a black background
- Use the same seeded Mulberry32 RNG already in the project for deterministic star/particle placement
- Mark each known system (Solar System + 6 exosystems) as a glowing dot with a label
- Positions should be plausible (not random): place the Solar System roughly 26,000 light-years from the galactic centre, in the Orion Arm; place exosystems at their approximate real galactic coordinates if known, otherwise distribute them plausibly within the Milky Way disc
- Hovering a marker highlights it and shows the system name; clicking selects the system and updates the info panel
- Support zoom (scroll) and pan (drag) as in the other canvas views

## Technical requirements

- New component: `src/components/GalaxyCanvas.tsx` — follows the same animation loop / camera / hit-testing pattern as `SolarSystemCanvas.tsx`
- New renderer: `src/renderers/galaxyRenderer.ts` — pure canvas drawing functions, no React dependency
- New simulation or layout module if needed: `src/simulation/galaxySimulation.ts` — positions and state for the galaxy markers
- New types in `src/types/index.ts` for galaxy-level data (e.g. `GalacticBody`, `GalaxyMarker`)
- Tab navigation in `src/App.tsx` extended with the new "Galaxy" tab; clicking a system marker in the Galaxy view switches to the Solar System tab with that system loaded (uses the system selector from Prompt 5)
- Add CSS for the new tab in `src/App.css` or a dedicated `GalaxyCanvas.css`

## Test requirements

- Create `src/simulation/__tests__/galaxySimulation.test.ts` (or equivalent) with unit tests for any new simulation/layout logic
- Tests must cover: marker positions are finite numbers, all known systems have a marker, hover/selection state transitions work correctly
- Run `npm test` after implementing — all tests (existing + new) must pass

## Context

- This is the most ambitious feature; plan the implementation in layers: data → renderer → component → tab wiring → tests
- The galaxy canvas does not need to be scientifically accurate, but positions should be internally consistent and plausible
- Clicking "Solar System" marker should behave like switching the system selector (Prompt 5) to that system and switching to the Solar System tab
- After implementing, run `npm start` and verify: Galaxy tab renders, markers visible, hover/click works, switching to Solar System from a marker works
