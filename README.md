# Star Systems

**[Live app → alexbreskin.github.io/Solar-System](https://alexbreskin.github.io/Solar-System/)**
[![Deploy](https://github.com/AlexBreskin/Solar-System/actions/workflows/deploy.yml/badge.svg)](https://github.com/AlexBreskin/Solar-System/actions/workflows/deploy.yml)

An interactive multi-system space simulator built with React, TypeScript, and HTML Canvas. Explore the Solar System and 15 exoplanetary/stellar systems — including black holes, neutron stars, and quasars — with real orbital mechanics, a galaxy map, a planet view with physically-scaled moon layouts, and detailed information for every body.

## Features

### System Selector

- **Multiple star systems** — switch between the Solar System and 15 confirmed exoplanetary/stellar systems, including black holes (Sgr A\*, Cygnus X-1), neutron stars (Lich, PSR J0437), and quasars (3C 273, TON 618)
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
- **Cluster menu** — when multiple systems overlap at low zoom, clicking shows a popup listing all candidates
- **Visual differentiation** — stars: gold/white dots; black holes: dark discs with orange glow; neutron stars: blue-white points; pulsing ring around selected system
- **Body View and speed controls hidden** — declutters the header when the Galaxy tab is active

### Shared

- **Celestial body navigator** — persistent left panel showing the body hierarchy when in System or Planet View; replaced by a star-system list when in Galaxy View
- **Info panel** — physical properties, orbital data, atmosphere, a fun fact, and direct links to NASA and Wikipedia articles for every body
- **Bidirectional highlighting** — hovering or selecting in the canvas syncs with the navigator, and vice versa

## Celestial Bodies

**Solar System** — all eight planets, five dwarf planets (Ceres, Pluto, Eris, Makemake, Haumea), the Asteroid Belt with its major members, the Kuiper Belt, and moons for Earth, Mars, Jupiter, Saturn, Neptune, and Pluto.

**Exosystems** — each system includes star and planet data with orbital mechanics tuned for visual clarity:

| System              | Type                              | Planets | Highlight                                                                 |
| ------------------- | --------------------------------- | ------- | ------------------------------------------------------------------------- |
| TRAPPIST-1          | Ultra-cool red dwarf              | 7       | Three planets in the habitable zone                                       |
| Kepler-90           | G-type (Solar twin)               | 8       | First exosystem with 8 confirmed planets                                  |
| 55 Cancri           | G8V binary primary                | 5       | Lava-world super-Earth + super-Jupiter                                    |
| HD 10180            | G1V Sun-like                      | 6       | Densest known Neptune-class system                                        |
| Tau Ceti            | G8.5V nearby                      | 4       | 11.9 light-years away; habitable-zone candidates                          |
| Gliese 667C         | M1.5V red dwarf                   | 3       | Triple star system; two habitable-zone worlds                             |
| Kepler-16           | K+M binary ("Tatooine")           | 1       | First confirmed circumbinary planet — two suns in the sky                 |
| Alpha Centauri      | G+K+M triple star                 | 1       | Nearest stellar system; hosts closest known exoplanet                     |
| 40 Eridani          | K+WD+M triple star                | 1       | Home of Vulcan (Star Trek); real super-Earth confirmed 2018               |
| Epsilon Eridani     | K2V orange dwarf                  | 1       | Nearest single sun-like star; top SETI target since Project Ozma          |
| Sirius              | A1V + white dwarf                 | —       | Brightest star in the night sky; white dwarf companion                    |
| Procyon             | F5 subgiant + white dwarf         | —       | Eighth brightest star; white dwarf companion                              |
| 61 Cygni            | K5+K7 binary                      | —       | First star to have its distance measured; nearly equal-mass pair          |
| Fomalhaut           | A3V + debris ring                 | 1       | Stunning debris ring; first Hubble-imaged planetary candidate             |
| HR 8799             | A5V young star                    | 4       | First multi-planet system directly photographed                           |
| Vega                | A0Va rapid rotator                | —       | Future north pole star; photometric calibration standard                  |
| Altair              | A7V oblate rotator                | —       | One of the fastest-spinning stars known; directly resolved shape          |
| Arcturus            | K1.5 III orange giant             | —       | Brightest northern star; ancient stellar stream traveller                 |
| Canopus             | F0 II supergiant                  | —       | Second brightest star; NASA deep-space navigation reference               |
| Polaris             | F6 Cepheid + 2 companions         | —       | North Star; triple system with close and wide F-type companions           |
| Antares             | M1.5 red supergiant + B companion | —       | Heart of Scorpius; red giant would engulf Mars if placed at the Sun       |
| Rigel               | B8 blue supergiant + companion    | —       | Orion's foot; 120,000× the Sun's luminosity                               |
| Betelgeuse          | M2 red supergiant                 | —       | Orion's shoulder; Great Dimming event 2019–2020                           |
| Deneb               | A2 blue-white supergiant          | —       | One of the most luminous stars in the Milky Way                           |
| Eta Carinae         | LBV + companion                   | —       | Great Eruption of 1843; one of the most massive stars known               |
| WR 104              | Wolf-Rayet + OB binary            | —       | Perfect pinwheel nebula; collimated jet may aim at Earth                  |
| VY Canis Majoris    | M5e red hypergiant                | —       | One of the largest known stars; would engulf Jupiter's orbit              |
| Mu Cephei           | M2 Ia red supergiant              | —       | Herschel's Garnet Star; 1,000× the Sun's diameter                         |
| NGC 3603            | Massive stellar cluster           | —       | Most massive young cluster in the Milky Way; home of NGC 3603-A1          |
| Westerlund 1        | Compact stellar cluster           | —       | Densest known young cluster; hosts a magnetar                             |
| Omega Centauri      | Globular cluster (halo)           | —       | Largest globular cluster in the Milky Way; possible stripped dwarf galaxy |
| 47 Tucanae          | Globular cluster (halo)           | —       | Brightest globular cluster; 25+ millisecond pulsars                       |
| Pistol Star         | Blue hypergiant (LBV)             | —       | Among the most luminous stars known; hidden behind galactic dust          |
| SS 433              | Black hole + A supergiant         | —       | First relativistic-jet source found; jets at 26% the speed of light       |
| Sagittarius A\*     | Black hole + S2 star              | —       | Milky Way's central black hole; S2 orbits at 2.7% light speed             |
| M87\*               | Supermassive black hole           | —       | First ever imaged black hole; event horizon spans the solar system        |
| Cygnus X-1          | Black hole + blue supergiant      | —       | One of the first identified black hole candidates; Hawking's lost bet     |
| Lich (PSR B1257+12) | Millisecond pulsar                | 3       | First confirmed exoplanets ever discovered, orbiting a stellar corpse     |
| PSR J0437-4715      | Millisecond pulsar + white dwarf  | —       | Nearest millisecond pulsar; used as a gravitational-wave detector         |
| 3C 273              | Quasar                            | —       | Brightest quasar in the sky; 4 trillion solar luminosities                |
| TON 618             | Quasar                            | —       | One of the most massive black holes known; event horizon spans 2,600 AU   |

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install and run

```bash
npm install
npm start
```

Opens at `http://localhost:5173`.

### Run tests

```bash
npm test
```

**Unit tests with coverage report** (HTML report written to `coverage/`):

```bash
npm test -- --coverage
```

**E2E tests** (Cypress — requires the dev server to be running):

```bash
# Terminal 1
npm start

# Terminal 2
npm run cypress:run      # headless
npm run cypress:open     # interactive UI
```

The Cypress suite covers 7 feature areas: system selector, tab switching, body navigator, info panel, speed controls, galaxy view, and zoom controls. Screenshots of failures are saved to `cypress/screenshots/` automatically.

CI runs unit tests then Cypress headlessly before every build — the badge above reflects the combined status.

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Controls

### System View

| Action              | Effect                                  |
| ------------------- | --------------------------------------- |
| Scroll              | Zoom toward cursor                      |
| +/− buttons         | Zoom in / zoom out (0.3× – 8×)          |
| Drag                | Pan the view                            |
| Click body          | Select, zoom in, and follow with camera |
| Double-click body   | Untrack (stop following)                |
| Drag while tracking | Break free from tracking                |
| Hover               | Highlight in canvas and navigator       |
| Click in navigator  | Select and track                        |

### Planet View

| Action                    | Effect                                          |
| ------------------------- | ----------------------------------------------- |
| Scroll                    | Zoom                                            |
| +/− buttons               | Zoom in / zoom out (0.2× – 8×)                  |
| Drag                      | Pan                                             |
| Click body                | Select                                          |
| Hover                     | Highlight in canvas and navigator               |
| Click planet in navigator | Switch viewed planet                            |
| Click moon in navigator   | Switch to its parent planet and select the moon |

### Galaxy View

| Action                    | Effect                                             |
| ------------------------- | -------------------------------------------------- |
| Scroll                    | Zoom (0.1× – 100×)                                 |
| +/− buttons               | Zoom in / zoom out (0.1× – 100×)                   |
| Drag                      | Pan                                                |
| Click system marker       | Select system and show info panel                  |
| Click region label        | Select galactic region and show info panel         |
| Click overlapping markers | Show cluster menu to pick a system                 |
| "Explore System →" button | Load the selected system and switch to System View |
| Click row in left panel   | Select system and highlight marker                 |
| Hover row or marker       | Sync highlight between list and canvas             |

## Project Structure

```
src/
├── App.tsx / App.css           # Root layout, system loading, tab state
├── types/
│   ├── bodies.ts               # BodyId, BodyType, CelestialBody, HierarchyNode, StarSystemMeta
│   ├── visual.ts               # Vec2, CanvasSize, BeltConfig, VisualConfig, PlanetViewLayout
│   ├── components.ts           # TabId, canvas props, InfoPanelProps
│   ├── galaxy.ts               # GalacticSystemEntry, GalaxyData, EXTRAGALACTIC_IDS
│   └── index.ts                # Barrel re-export
├── contexts/
│   └── StarSystemContext.tsx   # Active system data distributed via React context
├── data/
│   ├── systems/                # One JSON file per star system (add a file to add a system)
│   │   ├── sol.json
│   │   ├── trappist1.json
│   │   ├── kepler90.json
│   │   └── ...
│   ├── galaxy.json             # Galactic coordinates for all Milky Way systems
│   ├── galaxy.ts               # Typed loader for galaxy.json
│   ├── celestialBodies.ts      # Typed loader — auto-discovers systems via import.meta.glob
│   ├── systems.ts              # STAR_SYSTEMS list — auto-built from JSON metadata
│   └── __tests__/
│       ├── celestialBodies.test.ts   # Full Sol validation suite (shape, hierarchy, visualConfig)
│       └── exosystems.test.ts        # Runs the same checks against every non-Sol system
├── simulation/
│   ├── solarSystemSimulation.ts    # Orbital angle and position state
│   ├── planetViewSimulation.ts     # Moon angles, scaled layout, binary adjustment
│   ├── galaxySimulation.ts         # Galaxy marker positions, hover/select state, hit-testing
│   └── __tests__/
├── renderers/
│   ├── solarSystemRenderer.ts  # Canvas drawing — orbits, bodies, belts, rings
│   ├── planetViewRenderer.ts   # Canvas drawing — planet, moons, rings
│   └── galaxyRenderer.ts       # Canvas drawing — spiral background, system markers
├── utils/
│   ├── mulberry32.ts           # Shared seeded RNG (extracted from renderers)
│   └── distance.ts             # AU ↔ km ↔ ly conversion and formatting
└── components/
    ├── SolarSystemCanvas.tsx   # System view — animation loop, camera, hit-testing
    ├── PlanetViewCanvas.tsx    # Planet view — animation loop, camera, hit-testing
    ├── GalaxyCanvas.tsx/css    # Galaxy view — spiral map, system markers, cluster menu
    ├── GalaxyNavigator.tsx/css # Galaxy left panel — all systems sorted by distance
    ├── GalaxySystemPanel.tsx/css # Galaxy right panel — system info + Explore button
    ├── BodyNavigator.tsx/css   # System/Planet View left panel — body hierarchy tree
    └── InfoPanel.tsx/css       # System/Planet View right panel — body detail (context-driven)
```

## Adding a New Star System

1. Create `src/data/systems/<id>.json` with the standard schema (see any existing file)
2. Include a `"system"` block at the top with `id`, `name`, `description`, `starColor`, and `displayOrder`
3. Populate `"bodies"`, `"hierarchy"`, and `"visualConfig"` following the same structure as `sol.json`
4. The new system appears in the selector automatically — no TypeScript changes required

## Technical Notes

- **Architecture** — three layers: simulation (pure state classes), renderers (pure canvas functions with no React dependency), components (React lifecycle, events, refs)
- **Multi-system** — active system data flows from `App` through `StarSystemContext`; all components read bodies, hierarchy, and visualConfig from context rather than static imports; canvas components remount on system switch via `key` prop
- **Auto-discovery** — `import.meta.glob('./systems/*.json')` at build time scans the directory; the `"system"` metadata block in each JSON provides the name and display order without any TypeScript registration
- **Binary/multi-star systems** — stellar companions use `BodyType.Companion` and a `binaryMassFraction` field; the simulation does a two-pass position update so both bodies orbit the true barycenter; supports double and triple star configurations
- **Rendering** — HTML5 Canvas 2D with `requestAnimationFrame`; DevicePixelRatio-aware for high-DPI displays
- **Deterministic particles** — belt particle fields and the galaxy spiral background use a shared seeded RNG (`src/utils/mulberry32.ts`) so layouts are consistent across renders
- **Distance formatting** — `src/utils/distance.ts` converts AU↔km↔ly; orbital distances default to AU (4 sig figs, km on hover); star info panels show system distance from Earth in light-years (AU on hover)
- **Exotic objects** — `BodyType.BlackHole`, `BodyType.NeutronStar`, and `BodyType.Quasar` supported; black holes render as a dark disc with an accretion-disk glow; the `ROOT_BODY_TYPES` set replaces hardcoded star checks throughout
- **Simulation design** — `SolarSystemSimulation` uses a static `create()` factory that pre-computes all derived state (orbital speed lookup, pre-filtered binary/non-binary moon arrays); the private constructor does pure assignment only, keeping cyclomatic complexity at 1; per-frame methods (`updatePositions`, `advanceAngles`) stay below CC 5 by delegating each placement pass to a private helper
- **Tooling** — Vite for dev and builds; Vitest (820 unit tests across 8 suites) + Cypress E2E (8 spec files); ESLint with `max-statements-per-line`, `one-var`, and `complexity` (max 10) rules; V8 coverage via `@vitest/coverage-v8`; simulation layer at 100% branch coverage
