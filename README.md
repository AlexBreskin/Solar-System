# Solar System

An interactive 3D solar system simulation built with React and HTML Canvas.

## Features

- **Real orbital mechanics** — planets orbit the Sun with accurate relative speeds based on their real orbital periods
- **Interactive canvas** — zoom (scroll), pan (drag), click to select, double-click to track a body
- **Celestial body outliner** — hierarchical tree of the Sun, all 8 planets, Pluto, and selected moons; hover/click highlights in both panels
- **Info panel** — detailed information about each body including physical properties, orbital data, atmosphere, and fun facts
- **Saturn's rings** — rendered with elliptical arcs for a 3D-tilted appearance
- **Moon systems** — Earth's Moon, Mars' Phobos & Deimos, Jupiter's Galilean moons, Saturn's Titan & Enceladus, Neptune's Triton
- **Tracking mode** — camera follows a selected body as it orbits
- **Speed control** — 0.1× to 10× simulation speed
- **Orbit & label toggles**

## Bodies Included

| Body | Type |
|------|------|
| Sun | Star |
| Mercury, Venus, Earth, Mars | Inner planets |
| Jupiter, Saturn, Uranus, Neptune | Gas/Ice giants |
| Pluto | Dwarf planet |
| Moon | Earth's moon |
| Phobos, Deimos | Mars' moons |
| Io, Europa, Ganymede, Callisto | Jupiter's Galilean moons |
| Titan, Enceladus | Saturn's moons |
| Triton | Neptune's moon |

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Install & Run

```bash
cd "E:\Code\Other\Solar System"
npm install
npm start
```

The app will open at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

## Controls

| Action | Effect |
|--------|--------|
| Scroll | Zoom in/out |
| Drag | Pan the view |
| Click body | Select and zoom |
| Double-click body | Start tracking (camera follows) |
| Click in outliner | Select and track body |
| Hover | Highlight body in both panels |

## Project Structure

```
src/
├── App.js              # Root component, layout & state
├── App.css             # Global styles, dark space theme
├── data/
│   └── celestialBodies.js   # All celestial body data & visual config
└── components/
    ├── SolarSystemCanvas.js  # Canvas-based simulation renderer
    ├── Outliner.js            # Hierarchical body tree
    ├── Outliner.css
    ├── InfoPanel.js           # Selected body info display
    └── InfoPanel.css
```

## Technical Notes

- Uses HTML5 Canvas (2D context) with `requestAnimationFrame` for the simulation
- Orbital speeds are proportional to real values (Earth = 1 year baseline)
- Visual sizes and orbital radii are NOT to scale — scaled for visual clarity
- Camera pan/zoom uses smooth lerp interpolation
- Stars use a seeded deterministic RNG for consistent rendering
- DevicePixelRatio-aware canvas for crisp rendering on high-DPI displays
