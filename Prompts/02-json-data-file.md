# Prompt 2 — Celestial Bodies JSON Data File

Move all celestial body data from a TypeScript file into a JSON file.

## What to do

Replace `src/data/celestialBodies.ts` (which currently exports raw TypeScript objects) with a `src/data/celestialBodies.json` file. The TypeScript file should become a thin loader that imports the JSON and re-exports typed data.

## Requirements

- Create `src/data/celestialBodies.json` containing all body data currently defined in `celestialBodies.ts` — physical properties, orbital data, visual properties, moons, etc.
- Update `src/data/celestialBodies.ts` to import from the JSON file and re-export with the correct TypeScript types from `src/types/index.ts`; the exported API (function names, return types) must remain identical so no other files need changing
- Validate that `tsconfig.json` has `"resolveJsonModule": true` (it does — confirm and leave it)
- The JSON structure should mirror the current TypeScript data shape as closely as possible
- After making changes, run `npm test` to confirm all existing tests still pass, then run `npm start` and verify the app loads correctly with data from JSON

## Context

- `tsconfig.json` already has `"resolveJsonModule": true` and `"isolatedModules": true`
- All type definitions live in `src/types/index.ts`
- No other source files should need modification — only `celestialBodies.ts` and the new JSON file
