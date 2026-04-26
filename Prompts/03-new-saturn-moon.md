# Prompt 3 — Add a New Saturn Moon

Add one additional moon for Saturn to the celestial bodies data.

## What to do

Pick a real Saturn moon not yet in the data (e.g. Rhea, Dione, Tethys, Mimas, Iapetus, or Hyperion) and add it with accurate physical and orbital data.

## Requirements

- Add the new moon's entry to the data source — after Prompt 2 this will be `src/data/celestialBodies.json`; if Prompt 2 has not been done yet, add it to `src/data/celestialBodies.ts`
- Include all fields required by the existing moon schema: name, type, parent, radius (km), orbital period (days), semi-major axis (km), color/visual properties, fun fact, atmosphere info, and any other fields present on existing moons (match the schema of Titan or Enceladus exactly)
- Use real astronomical data — NASA or IAU values
- The moon should appear in:
  - The Solar System outliner tree under Saturn
  - The Planet View when Saturn is selected, orbiting at the correct relative radius and speed
  - The info panel when selected
- After making changes, run `npm test` to confirm all existing tests still pass, then run `npm start` and verify the new moon appears in both views

## Context

- Existing Saturn moons: Titan (period ~15.9 days, semi-major axis ~1.22M km) and Enceladus (period ~1.37 days, semi-major axis ~238k km)
- The Planet View scales orbital radii proportionally; adding a moon with a very large orbit may compress the inner moons — check the visual result
- Retrograde moons use a negative period value in the data
