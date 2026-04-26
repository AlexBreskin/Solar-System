# Prompt 5 — Multiple Solar Systems

Research and implement data for 6 additional real solar systems (exoplanetary systems), then add a system selector so the user can switch between them.

## What to do

1. Research 6 real exoplanetary systems with confirmed planets (good candidates: TRAPPIST-1, Kepler-90, 55 Cancri, HD 10180, Tau Ceti, Gliese 667C, or similar well-documented systems)
2. Model each system's star(s) and confirmed planets with real data (stellar radius, planet orbital periods, planet radii where known)
3. Add a system selector UI so the user can switch between "Solar System" and any of the 6 exosystems
4. The Solar System view should display whichever system is currently selected

## Data requirements

For each exosystem:
- System name and a brief description
- Host star: name, spectral type, radius (relative to Sun), color/visual properties, fun fact
- Confirmed planets: name, orbital period (days), semi-major axis (AU converted to km), radius (km or Earth radii), color, fun fact
- Moons are optional — omit if data is sparse
- Store in the same JSON format established in Prompt 2 (`src/data/celestialBodies.json`), or in separate per-system JSON files loaded dynamically

## UI requirements

- Add a system selector — a dropdown or pill strip — accessible from the Solar System view (e.g. in the header or toolbar)
- Switching systems resets the camera and clears any selection/tracking state
- The outliner, info panel, and planet view should all work for the selected system
- The currently selected system name should be visible at all times

## Technical requirements

- New types in `src/types/index.ts` for `SolarSystem` or `StarSystem` as needed
- The simulation and renderer layers should be system-agnostic — pass the body list in, don't hardcode the Solar System
- After implementing, run `npm test` to confirm all existing tests still pass, then run `npm start` and verify switching systems works

## Context

- The app currently has a single hardcoded system; this is the first step toward a multi-system architecture
- Visual scale does not need to match real AU distances — use the same "chosen for clarity" approach as the existing Solar System
- Exoplanet data sources: NASA Exoplanet Archive, exoplanet.eu, or Wikipedia confirmed planet tables
