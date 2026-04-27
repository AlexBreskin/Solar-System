# Solar System

An interactive solar system simulation built with React, TypeScript, and HTML Canvas. Features real orbital mechanics, a dedicated planet view with physically-scaled layouts, and detailed information for every body.

## Features

### Solar System View
- **Orbital mechanics** — all bodies orbit at speeds derived from their real orbital periods
- **Interactive canvas** — scroll to zoom, drag to pan, click to select, double-click to track
- **Tracking mode** — camera smoothly follows any selected body; dragging breaks free
- **Asteroid Belt & Kuiper Belt** — rendered as particle fields; both are selectable with info panels
- **Planetary rings** — Saturn, Jupiter, Uranus, and Neptune rendered with elliptical arcs; each planet has its own ring bands with individual intensity and colour, drawn with a front/back depth pass
- **Speed control** — 0.1× to 10× with pause/resume

### Planet View
- **Moon systems** — every planet's moons orbit with speeds proportional to their real periods, including retrograde (e.g. Triton)
- **Physically scaled** — planet size derived from real diameter; moon sizes and orbital radii proportional to real values, auto-fitted to the canvas
- **Binary system** — Pluto and Charon orbit their shared barycenter rather than Charon orbiting Pluto's centre; a barycenter marker is shown in this view

### Shared
- **Celestial body navigator** — persistent left panel showing the full hierarchy (Sun → planets → moons → belt members) across both tabs; tab-aware clicks switch the Planet View target
- **Info panel** — physical properties, orbital data, atmosphere, a fun fact, and direct links to NASA and Wikipedia articles for every body
- **Bidirectional highlighting** — hovering or selecting in the canvas syncs with the navigator, and vice versa

## Celestial Bodies

The simulation covers the solar system from Mercury to the Kuiper Belt: all eight planets, five dwarf planets (Ceres, Pluto, Eris, Makemake, Haumea), the Asteroid Belt with its major members, the Kuiper Belt, and moons for Earth, Mars, Jupiter, Saturn, Neptune, and Pluto (including all five of Pluto's known moons).

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

### Solar System View

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
├── App.tsx / App.css           # Root layout, tab state, shared state
├── types/
│   ├── bodies.ts               # BodyId, BodyType, CelestialBody, HierarchyNode, RingBand
│   ├── visual.ts               # Vec2, CanvasSize, BeltConfig, VisualConfig, PlanetViewLayout
│   ├── components.ts           # TabId, canvas props/state, InfoPanelProps, StatRowProps
│   └── index.ts                # Barrel re-export of all types above
├── data/
│   ├── sol.json                # All body data: physical, orbital, visual, hierarchy
│   └── celestialBodies.ts     # Typed loader for sol.json
├── simulation/
│   ├── solarSystemSimulation.ts    # Orbital angle and position state
│   ├── planetViewSimulation.ts     # Moon angles, scaled layout, binary adjustment
│   └── __tests__/
├── renderers/
│   ├── solarSystemRenderer.ts  # Canvas drawing — orbits, bodies, belts, rings
│   └── planetViewRenderer.ts   # Canvas drawing — planet, moons, rings
└── components/
    ├── SolarSystemCanvas.tsx   # Solar System tab — animation loop, camera, hit-testing
    ├── PlanetViewCanvas.tsx    # Planet View tab — animation loop, camera, hit-testing
    ├── BodyNavigator.tsx/css   # Persistent left-panel body hierarchy tree
    └── InfoPanel.tsx/css       # Selected body detail panel
```

## Technical Notes

- **Architecture** — three layers: simulation (pure state classes), renderers (pure canvas functions with no React dependency), components (React lifecycle, events, refs)
- **Data** — all body data lives in `sol.json`; adding or modifying a body requires only a JSON edit
- **Binary systems** — modelled via a `binaryMassFraction` field on the secondary body; the simulation does a two-pass position update so both bodies orbit the true barycenter; other moons of the primary orbit that same barycenter
- **Rendering** — HTML5 Canvas 2D with `requestAnimationFrame`; DevicePixelRatio-aware for high-DPI displays
- **Deterministic particles** — belt particle fields use a seeded RNG (Mulberry32) so the layout is consistent across renders
- **Visual scale** — orbital radii and body sizes are not to real scale; chosen for visual clarity
- **Tooling** — Vite for dev and builds; Vitest for tests
