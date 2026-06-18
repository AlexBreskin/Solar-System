# Star Systems

**[Live app → alexbreskin.github.io/Solar-System](https://alexbreskin.github.io/Solar-System/)**
[![Deploy](https://github.com/AlexBreskin/Solar-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/AlexBreskin/Solar-System/actions/workflows/deploy.yml)

An interactive multi-system space simulator built with React, TypeScript, and HTML Canvas. Explore the Solar System and 46 exoplanetary/stellar systems — including black holes, neutron stars, quasars, and galaxies — with real orbital mechanics, a galaxy map, a planet view with physically-scaled moon layouts, and detailed information for every body.

## Features

### System Selector

- **Multiple star systems** — switch between all 47 star systems (including Sol), including confirmed exoplanetary systems, black holes (Sgr A\*, Cygnus X-1), neutron stars (Lich, PSR J0437), quasars (3C 273, TON 618), globular clusters, and galaxies
- **Auto-discovery** — the app scans `src/data/systems/` at build time; adding a new JSON file with a `"system"` metadata block makes it appear in the selector automatically
- **Seamless switching** — switching systems resets the camera and simulation while preserving all UI preferences

### Solar System View

- **Orbital mechanics** — all bodies orbit at speeds derived from their real orbital periods
- **Interactive canvas** — scroll to zoom, drag to pan, click to select and follow, double-click to untrack
- **Tracking mode** — camera smoothly follows any selected body; dragging breaks free
- **Asteroid Belt & Kuiper Belt** — rendered as particle fields; both are selectable with info panels
- **Planetary rings** — Saturn, Jupiter, Uranus, and Neptune rendered with elliptical arcs; each planet has its own ring bands with individual intensity and colour, drawn with a front/back depth pass
- **Speed control** — 0.1× to 10× with pause/resume

### Planet View

- **Moon systems** — every planet's moons orbit with speeds proportional to their real periods, including retrograde (e.g. Triton)
- **Physically scaled** — planet size derived from real diameter; moon sizes and orbital radii proportional to real values, auto-fitted to the canvas
- **Binary systems** — bodies with a `binaryMassFraction` orbit their shared barycenter; Pluto/Charon demonstrates this for moons, and Kepler-16 / Alpha Centauri demonstrate it for stellar companions; a barycenter marker is shown in Planet View

### Galaxy View

- **Milky Way map** — top-down spiral galaxy with 39 systems plotted at their real approximate galactic coordinates; Sol is the reference point at (0, 0)
- **Zoom-dependent detail** — three rendering tiers: galaxy scale (≤0.5×, full spiral visible), neighbourhood scale (0.5–8×, spiral fades, star field grows), local scale (>8×, rich star field, distance labels, "Solar neighbourhood" hint)
- **Improved spiral** — 2 major arms (2000 particles each) + 2 minor arms (800 each) with warm inner / cool outer colouring; dust lane arcs at 8 kly and 22 kly; feathered scatter (15% vs 10%)
- **System list** — left panel shows all systems sorted by distance from Earth; hover a row to highlight its map marker; click to select and show details
- **System info panel** — clicking a marker or list row selects the system and shows its name, type badge, galactic arm, distance, and description; "Explore System →" loads it and switches to System View
- **Galactic arm labels** — each system's info panel shows which spiral arm or region it occupies (Orion Spur, Carina–Sagittarius, Perseus, Scutum–Centaurus, Norma, Outer, Galactic Centre, or Halo)
- **Clickable region labels** — 8 galactic regions are rendered as pill labels on the galaxy map (visible at zoom ≤ 6×); clicking one shows a description, fun fact, and Wikipedia link for that region; selecting a region clears the system selection and vice versa
- **Constellation browser** — the left navigator has two tabs (Systems / Constellations); the Constellations tab lists 29 constellations (Andromeda, Aquarius, Aquila, Ara, Boötes, Canes Venatici, Canis Major, Canis Minor, Cancer, Carina, Cassiopeia, Centaurus, Cepheus, Cetus, Cygnus, Eridanus, Hercules, Hydrus, Lyra, Orion, Pegasus, Pictor, Piscis Austrinus, Sagittarius, Scorpius, Tucana, Ursa Major, Ursa Minor, Virgo); selecting one highlights all member systems on the map and shows the constellation's description, a fun fact, a star-chart diagram, member-system buttons, and a Wikipedia link; hovering a star in the diagram shows its name; clicking a member star selects that system; double-clicking zooms the map to it
- **Search filter** — a search box at the top of each navigator tab filters by name as you type; the Systems tab filters both Milky Way and extragalactic systems, the Constellations tab searches constellation names and their member stars
- **Double-click to zoom** — double-clicking any system row in the left navigator or any member-system button in the right panel smoothly pans and zooms the galaxy map to centre on that system (zooms in to at least 5× if not already further in)
- **Cluster menu** — when multiple systems overlap at low zoom, clicking shows a popup listing all candidates
- **Visual differentiation** — stars: gold/white dots; black holes: dark discs with orange glow; neutron stars: blue-white points; pulsing ring around selected system
- **Body View and speed controls hidden** — declutters the header when the Galaxy tab is active

### Shared

- **Celestial body navigator** — persistent left panel showing the body hierarchy when in System or Planet View; replaced by a star-system list when in Galaxy View
- **Info panel** — physical properties, orbital data, atmosphere, a fun fact, and direct links to NASA and Wikipedia articles for every body
- **Bidirectional highlighting** — hovering or selecting in the canvas syncs with the navigator, and vice versa
- **Touch and pointer support** — all three canvas views accept mouse, touch, and stylus input via the Pointer Events API; drag to pan, two-finger pinch to zoom, tap to select, double-tap to track (System View)
- **Responsive layout** — adapts to desktop, tablet, and phone viewports; panels compress on tablet (≤1023px); on mobile (<640px) the side panels become slide-out drawers with a backdrop dismiss and navigation moves to a bottom tab bar; tested at 1440×900, 768×1024, 390×844, Galaxy S26 Ultra portrait (393×851), and Galaxy S26 Ultra landscape (851×393)
- **Firefox mobile compatible** — `100dvh` layout heights update correctly as the address bar shows and hides; Firefox-native `scrollbar-width`/`scrollbar-color` styles apply in all scrollable panels

## Celestial Bodies

**Solar System** — all eight planets, five dwarf planets (Ceres, Pluto, Eris, Makemake, Haumea), the Asteroid Belt with its major members, the Kuiper Belt, and moons for Earth, Mars, Jupiter, Saturn, Neptune, and Pluto.

**Exosystems** — each system includes star and planet data with orbital mechanics tuned for visual clarity:

| System              | Type                              | Planets | Highlight                                                                              |
| ------------------- | --------------------------------- | ------- | -------------------------------------------------------------------------------------- |
| TRAPPIST-1          | Ultra-cool red dwarf              | 7       | Three planets in the habitable zone                                                    |
| Kepler-90           | G-type (Solar twin)               | 8       | First exosystem with 8 confirmed planets                                               |
| 55 Cancri           | G8V binary primary                | 5       | Lava-world super-Earth + super-Jupiter                                                 |
| HD 10180            | G1V Sun-like                      | 6       | Densest known Neptune-class system                                                     |
| Tau Ceti            | G8.5V nearby                      | 4       | 11.9 light-years away; habitable-zone candidates                                       |
| Gliese 667C         | M1.5V red dwarf                   | 3       | Triple star system; two habitable-zone worlds                                          |
| Kepler-16           | K+M binary ("Tatooine")           | 1       | First confirmed circumbinary planet — two suns in the sky                              |
| Alpha Centauri      | G+K+M triple star                 | 1       | Nearest stellar system; hosts closest known exoplanet                                  |
| 40 Eridani          | K+WD+M triple star                | 1       | Home of Vulcan (Star Trek); real super-Earth confirmed 2018                            |
| Epsilon Eridani     | K2V orange dwarf                  | 1       | Nearest single sun-like star; top SETI target since Project Ozma                       |
| Sirius              | A1V + white dwarf                 | —       | Brightest star in the night sky; white dwarf companion                                 |
| Procyon             | F5 subgiant + white dwarf         | —       | Eighth brightest star; white dwarf companion                                           |
| 61 Cygni            | K5+K7 binary                      | —       | First star to have its distance measured; nearly equal-mass pair                       |
| Fomalhaut           | A3V + debris ring                 | 1       | Stunning debris ring; first Hubble-imaged planetary candidate                          |
| HR 8799             | A5V young star                    | 4       | First multi-planet system directly photographed                                        |
| Vega                | A0Va rapid rotator                | —       | Future north pole star; photometric calibration standard                               |
| Altair              | A7V oblate rotator                | —       | One of the fastest-spinning stars known; directly resolved shape                       |
| Arcturus            | K1.5 III orange giant             | —       | Brightest northern star; ancient stellar stream traveller                              |
| Canopus             | F0 II supergiant                  | —       | Second brightest star; NASA deep-space navigation reference                            |
| Polaris             | F6 Cepheid + 2 companions         | —       | North Star; triple system with close and wide F-type companions                        |
| Antares             | M1.5 red supergiant + B companion | —       | Heart of Scorpius; red giant would engulf Mars if placed at the Sun                    |
| Rigel               | B8 blue supergiant + companion    | —       | Orion's foot; 120,000× the Sun's luminosity                                            |
| Betelgeuse          | M2 red supergiant                 | —       | Orion's shoulder; Great Dimming event 2019–2020                                        |
| Deneb               | A2 blue-white supergiant          | —       | One of the most luminous stars in the Milky Way                                        |
| Eta Carinae         | LBV + companion                   | —       | Great Eruption of 1843; one of the most massive stars known                            |
| WR 104              | Wolf-Rayet + OB binary            | —       | Perfect pinwheel nebula; collimated jet may aim at Earth                               |
| VY Canis Majoris    | M5e red hypergiant                | —       | One of the largest known stars; would engulf Jupiter's orbit                           |
| Mu Cephei           | M2 Ia red supergiant              | —       | Herschel's Garnet Star; 1,000× the Sun's diameter                                      |
| NGC 3603            | Massive stellar cluster           | —       | Most massive young cluster in the Milky Way; home of NGC 3603-A1                       |
| Westerlund 1        | Compact stellar cluster           | —       | Densest known young cluster; hosts a magnetar                                          |
| Omega Centauri      | Globular cluster (halo)           | —       | Largest globular cluster in the Milky Way; possible stripped dwarf galaxy              |
| 47 Tucanae          | Globular cluster (halo)           | —       | Brightest globular cluster; 25+ millisecond pulsars                                    |
| Pistol Star         | Blue hypergiant (LBV)             | —       | Among the most luminous stars known; hidden behind galactic dust                       |
| SS 433              | Black hole + A supergiant         | —       | First relativistic-jet source found; jets at 26% the speed of light                    |
| Sagittarius A\*     | Black hole + S2 star              | —       | Milky Way's central black hole; S2 orbits at 2.7% light speed                          |
| M87\*               | Supermassive black hole           | —       | First ever imaged black hole; event horizon spans the solar system                     |
| Cygnus X-1          | Black hole + blue supergiant      | —       | One of the first identified black hole candidates; Hawking's lost bet                  |
| Lich (PSR B1257+12) | Millisecond pulsar                | 3       | First confirmed exoplanets ever discovered, orbiting a stellar corpse                  |
| PSR J0437-4715      | Millisecond pulsar + white dwarf  | —       | Nearest millisecond pulsar; used as a gravitational-wave detector                      |
| 3C 273              | Quasar                            | —       | Brightest quasar in the sky; 4 trillion solar luminosities                             |
| TON 618             | Quasar                            | —       | One of the most massive black holes known; event horizon spans 2,600 AU                |
| Andromeda Galaxy    | Spiral galaxy                     | —       | Nearest large galaxy; on a 4.5-billion-year collision course with the Milky Way        |
| Hercules Cluster    | Globular cluster                  | —       | Finest northern globular; 1974 Arecibo Message aimed here                              |
| Bode's Galaxy       | Spiral galaxy                     | —       | Brightest northern galaxy; gravitationally linked to the Cigar Galaxy                  |
| GRO J1655-40        | Black hole + F subgiant binary    | —       | Second Milky Way object with apparent superluminal jets; black hole mass 6.3 M☉        |
| Circinus X-1        | Neutron star + B giant binary     | —       | Highly elliptical orbit (e=0.45); sits inside its own 4,600-year-old supernova remnant |

## Getting Started

### Prerequisites

- [mise](https://mise.jdx.dev) — manages the Node version for this project (see `.mise.toml`)
- npm (bundled with the Node version mise installs)

### Install and run

```bash
mise install   # installs the Node version pinned in .mise.toml
npm install
npm start
```

Opens at `http://localhost:5173`.

### Managing the Node version

This project's Node version is pinned in [.mise.toml](.mise.toml), not in `package.json` or a `.nvmrc`. CI (`jdx/mise-action`) reads the same file, so local and CI environments always match.

```bash
mise current node        # show the version currently active for this project
mise ls-remote node       # list all available Node versions
mise use node@22          # pin a different major version (writes to .mise.toml)
mise install               # install the version now pinned in .mise.toml
```

After changing `.mise.toml`, run `mise install` and then `npm run check` to confirm the project still builds and passes tests on the new version before committing.

A scheduled workflow ([bump-node-version.yml](.github/workflows/bump-node-version.yml)) automatically checks for newer Node releases within the current major every Monday, runs the full test suite against the candidate version, and opens a PR only if everything passes. Major version bumps (e.g. 24 → 25) are intentionally left out of automation — bump those manually with `mise use node@<major>` once you're ready to test for breaking changes.

### Run tests

```bash
npm test                  # unit tests
npm test -- --coverage    # unit tests + HTML coverage report (written to coverage/)
npm run lint              # ESLint
npm run check             # type-check + lint + unit tests in one command
```

**E2E tests** (Cypress — requires the dev server to be running):

```bash
# Terminal 1
npm start

# Terminal 2
npm run cypress:run      # headless
npm run cypress:open     # interactive UI
```

The Cypress suite covers 8 feature areas: system selector, tab switching, body navigator, info panel, speed controls, galaxy view, zoom controls, and responsive layout (desktop/tablet/mobile/Galaxy S26 Ultra portrait+landscape). Screenshots of failures are saved to `cypress/screenshots/` automatically.

A pre-commit hook (`.githooks/pre-commit`) runs `npm run lint` and `npm test` automatically before every commit. The hook path is wired up via `npm install` through the `prepare` script.

CI runs unit tests then Cypress headlessly before every build — the badge above reflects the combined status.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Controls

### System View

| Action                    | Effect                                  |
| ------------------------- | --------------------------------------- |
| Scroll                    | Zoom toward cursor                      |
| Pinch (two fingers)       | Zoom (0.3× – 8×)                        |
| +/− buttons               | Zoom in / zoom out (0.3× – 8×)          |
| Drag / touch-drag         | Pan the view                            |
| Click / tap body          | Select, zoom in, and follow with camera |
| Double-click / double-tap | Untrack (stop following)                |
| Drag while tracking       | Break free from tracking                |
| Hover                     | Highlight in canvas and navigator       |
| Click in navigator        | Select and track                        |

### Planet View

| Action                    | Effect                                          |
| ------------------------- | ----------------------------------------------- |
| Scroll                    | Zoom                                            |
| Pinch (two fingers)       | Zoom (0.2× – 8×)                                |
| +/− buttons               | Zoom in / zoom out (0.2× – 8×)                  |
| Drag / touch-drag         | Pan                                             |
| Click / tap body          | Select                                          |
| Hover                     | Highlight in canvas and navigator               |
| Click planet in navigator | Switch viewed planet                            |
| Click moon in navigator   | Switch to its parent planet and select the moon |

### Galaxy View

| Action                            | Effect                                             |
| --------------------------------- | -------------------------------------------------- |
| Scroll                            | Zoom (0.1× – 100×)                                 |
| Pinch (two fingers)               | Zoom (0.1× – 100×)                                 |
| +/− buttons                       | Zoom in / zoom out (0.1× – 100×)                   |
| Drag / touch-drag                 | Pan                                                |
| Click / tap system marker         | Select system and show info panel                  |
| Click / tap region label          | Select galactic region and show info panel         |
| Click overlapping markers         | Show cluster menu to pick a system                 |
| "Explore System →" button         | Load the selected system and switch to System View |
| Click row in left panel           | Select system and highlight marker                 |
| Double-click row in left panel    | Zoom and pan map to centre on that system          |
| Double-click member-system button | Zoom and pan map to centre on that system          |
| Hover row or marker               | Sync highlight between list and canvas             |

## Project Structure

```
src/
├── App.tsx / App.css           # Root layout, tab state, responsive drawer/mobile logic
├── index.tsx / vite-env.d.ts
├── __tests__/
│   └── folder-naming.test.ts       # Enforces naming conventions across the src tree
├── types/
│   ├── bodies.ts               # BodyId, BodyType, CelestialBody, HierarchyNode, StarSystemMeta
│   ├── visual.ts               # Vec2, CanvasSize, BeltConfig, VisualConfig, PlanetViewLayout
│   ├── components.ts           # TabId, canvas props, InfoPanelProps
│   ├── galaxy.ts               # GalacticSystemEntry, GalaxyData, EXTRAGALACTIC_IDS
│   └── index.ts                # Barrel re-export
├── data/
│   ├── systems/                # One JSON file per star system (add a file to add a system)
│   │   ├── sol.json
│   │   ├── trappist1.json
│   │   └── ...                 # 47 total
│   ├── constellations/         # One JSON file per constellation (auto-discovered via glob)
│   │   ├── orion.json
│   │   ├── centaurus.json
│   │   └── ...                 # 29 total
│   ├── galaxy.json             # Galactic coordinates for all Milky Way systems
│   ├── galaxy.ts               # Typed loader for galaxy.json
│   ├── constellations.ts       # CONSTELLATIONS list + CONSTELLATION_BY_SYSTEM index — auto-built
│   ├── celestialBodies.ts      # Typed loader — auto-discovers systems via import.meta.glob
│   ├── systems.ts              # STAR_SYSTEMS list — auto-built from JSON metadata
│   ├── systemMeta.ts           # Helper to resolve StarSystemMeta by id
│   └── __tests__/
│       ├── celestialBodies.test.ts   # Full Sol validation suite (shape, hierarchy, visualConfig)
│       ├── constellations.test.ts    # IAU name, coordinate (Hipparcos), magnitude, and system-ID checks
│       ├── exosystems.test.ts        # Runs the same checks against every non-Sol system
│       └── systemMeta.test.ts        # systemMeta lookup and fallback edge cases
├── hooks/                      # App-level React hooks extracted from App.tsx
│   ├── useBodySelection.ts     # Selected/hovered/tracked body state and event handlers
│   ├── useGalaxyState.ts       # Galaxy canvas ref, selected system/region/constellation
│   ├── useNavFilter.ts         # Search-filter state for the left-panel navigator
│   ├── useSystemNavigation.ts  # System-switching (synchronous — all data is eagerly loaded)
│   └── __tests__/
│       ├── useBodySelection.test.ts
│       ├── useGalaxyState.test.ts
│       ├── useNavFilter.test.ts
│       └── useSystemNavigation.test.ts
├── simulation/
│   ├── solarSystemSimulation.ts    # Orbital angle and position state
│   ├── planetViewSimulation.ts     # Moon angles, scaled layout, binary adjustment
│   ├── galaxySimulation.ts         # Galaxy marker positions, hover/select state, hit-testing
│   └── __tests__/
│       ├── solarSystemSimulation.test.ts
│       ├── planetViewSimulation.test.ts
│       └── galaxySimulation.test.ts
├── renderers/
│   ├── galaxy-view/
│   │   ├── galaxyParticles.ts  # LOD particle generation + offscreen canvas caches
│   │   ├── galaxyMarkers.ts    # System marker bitmaps and drawSystemMarkers
│   │   ├── galaxyRegions.ts    # Galactic region pill labels
│   │   ├── galaxyRenderer.ts   # Background, galactic bar, arm guides, viewport stars
│   │   └── index.ts            # Public API re-exports
│   ├── planet-view/
│   │   ├── planetRenderer.ts   # Planet, moons, rings
│   │   └── index.ts
│   └── system-view/
│       ├── systemRenderer.ts   # Star field, orbits, ring drawing
│       ├── systemBelts.ts      # Belt particle fields and drawing
│       ├── systemBodies.ts     # Bodies, sun, black hole, selection glows
│       └── index.ts            # Public API re-exports
├── utils/
│   ├── mulberry32.ts                # Shared seeded RNG
│   ├── color.ts                     # lighten() hex colour utility
│   ├── distance.ts                  # AU ↔ km ↔ ly conversion and formatting
│   ├── constellationProjection.ts   # Project galactic coordinates onto canvas space
│   ├── getPlanetViewId.ts           # Resolve which body to show in Planet View for a selection
│   ├── renderHook.ts                # Minimal React test helper for unit-testing custom hooks
│   └── __tests__/
│       ├── color.test.ts
│       ├── constellationProjection.test.ts
│       ├── distance.test.ts
│       ├── getPlanetViewId.test.ts
│       └── mulberry32.test.ts
├── components/
│   ├── app/
│   │   ├── CanvasArea.tsx      # Switches between System/Planet/Galaxy canvas per active tab
│   │   ├── HeaderControls.tsx  # Speed, pause, orbits, labels controls
│   │   └── RightPanel.tsx      # Context-sensitive right panel (body info or galaxy info)
│   ├── system-view/
│   │   ├── SystemCanvas.tsx    # System view — animation loop, camera, pointer events, pinch zoom
│   │   ├── BodyNavigator.tsx/css # Left panel — body hierarchy tree
│   │   └── InfoPanel.tsx/css   # Right panel — body detail (context-driven)
│   ├── planet-view/
│   │   └── PlanetCanvas.tsx    # Planet view — animation loop, camera, pointer events, pinch zoom
│   └── galaxy-view/
│       ├── GalaxyCanvas.tsx/css        # Galaxy view — spiral map, markers, cluster menu, pinch zoom
│       ├── GalaxyNavigator.tsx/css     # Left panel — systems and constellations tabs
│       ├── GalaxySystemPanel.tsx/css   # Right panel — system info + Explore button
│       └── constellation/
│           └── ConstellationDiagram.tsx  # Interactive star-chart for the selected constellation
└── shared/
    ├── contexts/
    │   └── StarSystemContext.tsx # Active system data distributed via React context
    ├── components/
    │   ├── ZoomControls.tsx      # +/− zoom buttons shared across all three canvas views
    │   └── canvas-shared.css     # Shared zoom-control button styles
    └── hooks/
        ├── useZoomControls.ts    # Zoom state logic shared across all three canvas views
        └── __tests__/
            └── useZoomControls.test.ts
```

## Adding a New Star System

1. Create `src/data/systems/<id>.json` with the standard schema (see any existing file)
2. Include a `"system"` block at the top with `id`, `name`, `description`, `starColor`, and `displayOrder`
3. Populate `"bodies"`, `"hierarchy"`, and `"visualConfig"` following the same structure as `sol.json`
4. The new system appears in the selector automatically — no TypeScript changes required

## Technical Notes

- **Architecture** — three layers: simulation (pure state classes), renderers (pure canvas functions with no React dependency), components (React lifecycle, events, refs)
- **Multi-system** — active system data flows from `App` through `StarSystemContext`; all components read bodies, hierarchy, and visualConfig from context rather than static imports; canvas components remount on system switch via `key` prop
- **Auto-discovery** — `import.meta.glob('./systems/*.json', { eager: true })` at build time scans the directory; all 47 system JSON files are bundled eagerly so switching systems is instantaneous; the `"system"` metadata block in each JSON provides the name and display order without any TypeScript registration
- **Binary/multi-star systems** — stellar companions use `BodyType.Companion` and a `binaryMassFraction` field; the simulation does a two-pass position update so both bodies orbit the true barycenter; supports double and triple star configurations
- **Rendering** — HTML5 Canvas 2D with `requestAnimationFrame`; DevicePixelRatio-aware for high-DPI displays
- **Deterministic particles** — belt particle fields and the galaxy spiral background use a shared seeded RNG (`src/utils/mulberry32.ts`) so layouts are consistent across renders
- **Distance formatting** — `src/utils/distance.ts` converts AU↔km↔ly; orbital distances default to AU (4 sig figs, km on hover); star info panels show system distance from Earth in light-years (AU on hover)
- **Exotic objects** — `BodyType.BlackHole`, `BodyType.NeutronStar`, and `BodyType.Quasar` supported; black holes render as a dark disc with an accretion-disk glow; the `ROOT_BODY_TYPES` set replaces hardcoded star checks throughout
- **Simulation design** — `SolarSystemSimulation` uses a static `create()` factory that pre-computes all derived state (orbital speed lookup, pre-filtered binary/non-binary moon arrays); the private constructor does pure assignment only, keeping cyclomatic complexity at 1; per-frame methods (`updatePositions`, `advanceAngles`) stay below CC 5 by delegating each placement pass to a private helper
- **Constellation data** — 29 constellations in individual JSON files under `src/data/constellations/`; each file is validated by `constellations.test.ts` against the Hipparcos J2000 catalog (positions within 2°, magnitudes within ±1.0 mag) and all 88 official IAU constellation names; `constellations.ts` auto-discovers files via `import.meta.glob` and builds a `CONSTELLATION_BY_SYSTEM` reverse index
- **Pointer Events API** — all three canvas views handle input through `onPointerDown/Move/Up/Cancel/Leave` instead of separate mouse and touch handlers; `setPointerCapture` keeps events flowing when a finger leaves the canvas boundary; a `Map<pointerId, {x,y}>` tracks simultaneous pointers to compute two-finger pinch distance; `touch-action: none` prevents browser scroll/pinch from intercepting canvas gestures
- **Responsive layout** — CSS breakpoints at 1023px (tablet: narrower panels, logo/speed hidden) and 639px (mobile: fixed-position slide-out drawers, bottom tab bar); `100dvh` with `100vh` fallback in `.app-main` height calculations ensures the layout is correct on Firefox Android as the address bar appears and disappears; Firefox-native `scrollbar-width: thin` and `scrollbar-color` applied alongside the webkit pseudo-element rules
- **Tooling** — Vite 8 (native `tsconfig` paths, no plugin needed) for dev and builds; Vitest unit tests + Cypress E2E (8 spec files); ESLint flat config with `max-statements-per-line`, `one-var`, and `complexity` (max 10) rules; pre-commit hook (see "Run tests" above); V8 coverage via `@vitest/coverage-v8` (85%+ overall, 100% branch on simulation layer)
