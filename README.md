# Solar System

An interactive solar system simulation built with React, TypeScript, and HTML Canvas, featuring real orbital mechanics, a detailed planet view, and a rich celestial body information panel.

## Features

### Solar System View
- **Real orbital mechanics** — all bodies orbit with speeds proportional to their real orbital periods (Earth = 1 year baseline)
- **Interactive canvas** — scroll to zoom, drag to pan, click to select, double-click to track
- **Tracking mode** — camera locks onto and smoothly follows any selected body as it orbits; dragging the view breaks free from tracking
- **Orbit rings** — faint dashed rings always visible for all planets; highlighted ring shown for selected/hovered body; toggle to hide all
- **Label toggle** — show/hide body name labels on the canvas
- **Saturn's rings** — rendered with elliptical arcs using a front/back pass for correct depth
- **Speed control** — 0.1× to 10× simulation speed with pause/resume

### Planet View
- **Dedicated planet canvas** — shows a single planet centred on screen with all its simulated moons orbiting around it
- **Planet selector** — horizontal pill strip in the header to switch between any planet or dwarf planet
- **Physically scaled layout** — planet size is derived from its real diameter; moon sizes scale proportionally to each other based on real diameters; orbital radii are proportional to real distances, auto-fitted to the canvas with guaranteed no-clipping spacing
- **Relative orbital speeds** — moons orbit at speeds proportional to their real periods relative to each other
- **Retrograde support** — retrograde moons (e.g. Triton) orbit in the correct direction
- **Saturn's rings** — scale with the planet radius in Planet View

### Shared
- **Tab navigation** — switch between Solar System and Planet View; switching is context-aware (selecting Earth then switching opens the Earth system)
- **Celestial body outliner** — in Solar System view shows the full hierarchical tree (Sun → planets → moons); in Planet View shows a flat list of the planet and its moons, with the header updating to e.g. "Saturn System"
- **Info panel** — physical properties, orbital data, atmosphere composition, and a fun fact for every body
- **Bidirectional highlighting** — hovering or clicking in the canvas highlights the matching row in the outliner, and vice versa

## Celestial Bodies

| Body | Type | Parent |
|------|------|--------|
| Sun | Star | — |
| Mercury, Venus, Earth, Mars | Planet | Sun |
| Ceres | Dwarf Planet | Sun |
| Jupiter, Saturn, Uranus, Neptune | Planet | Sun |
| Pluto | Dwarf Planet | Sun |
| Moon | Moon | Earth |
| Phobos, Deimos | Moon | Mars |
| Io, Europa, Ganymede, Callisto | Moon | Jupiter |
| Titan, Enceladus | Moon | Saturn |
| Triton | Moon | Neptune |

## Getting Started

### Prerequisites
- Node.js 18+ and npm

### Install & Run

```bash
npm install
npm start
```

The app will open at `http://localhost:5173`.

### Run Tests

```bash
npm test
```

### Build for Production

```bash
npm run build
```

Output is placed in the `dist/` directory.

## Controls

### Solar System View

| Action | Effect |
|--------|--------|
| Scroll | Zoom in/out toward mouse |
| Drag | Pan the view |
| Click body | Select body and zoom toward it |
| Double-click body | Lock camera to track body |
| Drag while tracking | Break free from tracking |
| Hover | Highlight body in canvas and outliner |
| Click in outliner | Select and track body |

### Planet View

| Action | Effect |
|--------|--------|
| Scroll | Zoom in/out |
| Drag | Pan the view |
| Click body | Select body |
| Hover | Highlight body in canvas and outliner |
| Planet selector (header) | Switch which planet is displayed |

## Project Structure

```
Solar-System/
├── index.html                  # HTML entry point (Vite root)
├── package.json
├── tsconfig.json
├── tsconfig.node.json          # TypeScript config for Vite config file
├── vite.config.ts              # Vite + Vitest configuration
├── .gitignore
└── src/
    ├── index.tsx               # React entry point
    ├── App.tsx                 # Root component — tab state, shared state, layout
    ├── App.css                 # Global styles, dark space theme, tab bar
    ├── types/
    │   └── index.ts            # All shared TypeScript interfaces and type aliases
    ├── data/
    │   └── celestialBodies.ts  # All body data (physical, orbital, visual) & hierarchy
    ├── simulation/
    │   ├── solarSystemSimulation.ts    # Orbital angle & position state for the solar system view
    │   ├── planetViewSimulation.ts     # Moon angle & position state, scaled layout for planet view
    │   └── __tests__/
    │       ├── solarSystemSimulation.test.ts
    │       └── planetViewSimulation.test.ts
    ├── renderers/
    │   ├── solarSystemRenderer.ts  # Pure canvas drawing functions for the solar system
    │   └── planetViewRenderer.ts   # Pure canvas drawing functions for the planet view
    └── components/
        ├── SolarSystemCanvas.tsx   # Solar System tab — animation loop, camera, hit-testing
        ├── PlanetViewCanvas.tsx    # Planet View tab — animation loop, camera, hit-testing
        ├── PlanetSelector.tsx      # Planet View header — planet picker pill strip
        ├── PlanetSelector.css
        ├── Outliner.tsx            # Hierarchical (solar system) & flat (planet view) body tree
        ├── Outliner.css
        ├── InfoPanel.tsx           # Selected body detail panel
        └── InfoPanel.css
```

## Technical Notes

- **Language** — TypeScript throughout with strict mode enabled; all component props, simulation state, data types, and layout objects are fully typed via shared interfaces in `src/types/index.ts`
- **Architecture** — separated into three layers: simulation (pure physics/angle state classes), renderers (pure canvas drawing functions with no React dependency), and components (React lifecycle, event handling, refs)
- **Rendering** — HTML5 Canvas 2D with `requestAnimationFrame`; DevicePixelRatio-aware for crisp rendering on high-DPI displays
- **Orbital mechanics** — speeds derived from real orbital periods; Earth's year is the baseline unit; retrograde bodies (e.g. Triton) use a negative period
- **Planet View scaling** — planet radius is normalised against the Sun's diameter and clamped; moon radii are normalised against the largest moon in the scene; orbital radii are proportionally mapped then enforced with a minimum-gap second pass and a uniform scale-down third pass to guarantee fit
- **Camera** — pan and zoom use smooth lerp interpolation each frame; zoom anchors to the tracked body when tracking is active
- **Stars** — seeded deterministic RNG (Mulberry32) for a consistent star field across renders
- **Solar System visual scale** — orbital radii and body sizes are NOT to real scale; chosen for visual clarity
- **Tooling** — Vite 6 for dev server and production builds; Vitest 2 for unit tests (Jest-compatible API, no configuration overhead); zero high-severity vulnerabilities
- **Tests** — 27 unit tests covering both simulation modules; run with `npm test`
