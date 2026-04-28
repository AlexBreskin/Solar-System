# Star Systems

An interactive multi-system space simulator built with React, TypeScript, and HTML Canvas. Explore the Solar System and eight exoplanetary/stellar systems, with real orbital mechanics, a planet view with physically-scaled moon layouts, and detailed information for every body.

## Features

### System Selector
- **Multiple star systems** — switch between the Solar System and eight confirmed exoplanetary/stellar systems: TRAPPIST-1, Kepler-90, 55 Cancri, HD 10180, Tau Ceti, Gliese 667C, Kepler-16, and Alpha Centauri
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

### Shared
- **Celestial body navigator** — persistent left panel showing the body hierarchy across both tabs; collapsed by default (showing the star, planets, and belts); clicking a moon in the canvas auto-expands its parent and scrolls it into view; displays the active system name
- **Info panel** — physical properties, orbital data, atmosphere, a fun fact, and direct links to NASA and Wikipedia articles for every body
- **Bidirectional highlighting** — hovering or selecting in the canvas syncs with the navigator, and vice versa

## Celestial Bodies

**Solar System** — all eight planets, five dwarf planets (Ceres, Pluto, Eris, Makemake, Haumea), the Asteroid Belt with its major members, the Kuiper Belt, and moons for Earth, Mars, Jupiter, Saturn, Neptune, and Pluto.

**Exosystems** — each system includes star and planet data with orbital mechanics tuned for visual clarity:

| System | Type | Planets | Highlight |
|--------|------|---------|-----------|
| TRAPPIST-1 | Ultra-cool red dwarf | 7 | Three planets in the habitable zone |
| Kepler-90 | G-type (Solar twin) | 8 | First exosystem with 8 confirmed planets |
| 55 Cancri | G8V binary primary | 5 | Lava-world super-Earth + super-Jupiter |
| HD 10180 | G1V Sun-like | 6 | Densest known Neptune-class system |
| Tau Ceti | G8.5V nearby | 4 | 11.9 light-years away; habitable-zone candidates |
| Gliese 667C | M1.5V red dwarf | 3 | Triple star system; two habitable-zone worlds |
| Kepler-16 | K+M binary ("Tatooine") | 1 | First confirmed circumbinary planet — two suns in the sky |
| Alpha Centauri | G+K+M triple star | 1 | Nearest stellar system; hosts closest known exoplanet |
| Sagittarius A* | Black hole + S2 star | — | Milky Way's central black hole; S2 orbits at 2.7% light speed |
| M87* | Supermassive black hole | — | First ever imaged black hole; event horizon spans the solar system |
| Cygnus X-1 | Black hole + blue supergiant | — | One of the first identified black hole candidates; Hawking's lost bet |
| Lich (PSR B1257+12) | Millisecond pulsar | 3 | First confirmed exoplanets ever discovered, orbiting a stellar corpse |
| PSR J0437-4715 | Millisecond pulsar + white dwarf | — | Nearest millisecond pulsar; used as a gravitational-wave detector |
| 3C 273 | Quasar | — | Brightest quasar in the sky; 4 trillion solar luminosities |
| TON 618 | Quasar | — | One of the most massive black holes known; event horizon spans 2,600 AU |

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

### Build for production

```bash
npm run build
```

Output goes to `dist/`.

## Controls

### System View

| Action | Effect |
|--------|--------|
| Scroll | Zoom toward cursor |
| Drag | Pan the view |
| Click body | Select, zoom in, and follow with camera |
| Double-click body | Untrack (stop following) |
| Drag while tracking | Break free from tracking |
| Hover | Highlight in canvas and navigator |
| Click in navigator | Select and track |

### Planet View

| Action | Effect |
|--------|--------|
| Scroll | Zoom |
| Drag | Pan |
| Click body | Select |
| Hover | Highlight in canvas and navigator |
| Click planet in navigator | Switch viewed planet |
| Click moon in navigator | Switch to its parent planet and select the moon |

## Project Structure

```
src/
├── App.tsx / App.css           # Root layout, system loading, tab state
├── types/
│   ├── bodies.ts               # BodyId, BodyType, CelestialBody, HierarchyNode, StarSystemMeta
│   ├── visual.ts               # Vec2, CanvasSize, BeltConfig, VisualConfig, PlanetViewLayout
│   ├── components.ts           # TabId, canvas props, InfoPanelProps
│   └── index.ts                # Barrel re-export
├── contexts/
│   └── StarSystemContext.tsx   # Active system data distributed via React context
├── data/
│   ├── systems/                # One JSON file per star system (add a file to add a system)
│   │   ├── sol.json
│   │   ├── trappist1.json
│   │   ├── kepler90.json
│   │   └── ...
│   ├── celestialBodies.ts      # Typed loader — auto-discovers systems via import.meta.glob
│   ├── systems.ts              # STAR_SYSTEMS list — auto-built from JSON metadata
│   └── __tests__/
│       ├── celestialBodies.test.ts   # Full Sol validation suite (shape, hierarchy, visualConfig)
│       └── exosystems.test.ts        # Runs the same checks against every non-Sol system
├── simulation/
│   ├── solarSystemSimulation.ts    # Orbital angle and position state
│   ├── planetViewSimulation.ts     # Moon angles, scaled layout, binary adjustment
│   └── __tests__/
├── renderers/
│   ├── solarSystemRenderer.ts  # Canvas drawing — orbits, bodies, belts, rings
│   └── planetViewRenderer.ts   # Canvas drawing — planet, moons, rings
└── components/
    ├── SolarSystemCanvas.tsx   # System view — animation loop, camera, hit-testing
    ├── PlanetViewCanvas.tsx    # Planet view — animation loop, camera, hit-testing
    ├── BodyNavigator.tsx/css   # Left-panel body hierarchy tree (context-driven)
    └── InfoPanel.tsx/css       # Selected body detail panel (context-driven)
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
- **Deterministic particles** — belt particle fields use a seeded RNG (Mulberry32) so the layout is consistent across renders
- **Distance formatting** — `src/utils/distance.ts` converts AU↔km↔ly; orbital distances default to AU (4 sig figs, km on hover); star info panels show system distance from Earth in light-years (AU on hover)
- **Exotic objects** — `BodyType.BlackHole`, `BodyType.NeutronStar`, and `BodyType.Quasar` supported; black holes render as a dark disc with an accretion-disk glow; the `ROOT_BODY_TYPES` set replaces hardcoded star checks throughout
- **Tooling** — Vite for dev and builds; Vitest for tests; 349 tests across 5 suites; ESLint with `max-statements-per-line` and `one-var` rules enforcing consistent style
