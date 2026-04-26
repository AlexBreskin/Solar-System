# Prompt 4 — Tests for the JSON Data Loader

Write a test file that validates the celestial bodies JSON data and its TypeScript loader.

## What to do

Create `src/data/__tests__/celestialBodies.test.ts` that tests the data loaded from `src/data/celestialBodies.json` via the typed loader in `src/data/celestialBodies.ts`.

## Requirements

Test the shape and integrity of the loaded data — not simulation logic (that is covered in the existing simulation tests). Good tests to write:

- Every body has the required fields (name, type, radius, color, etc.) and they are the correct types (no undefined, no NaN)
- Every body with a parent has a parent that exists in the data
- All orbital periods are non-zero
- All radii are positive numbers
- Moon bodies are children of a known planet or dwarf planet
- The newly added Saturn moon from Prompt 3 exists and has the correct parent
- The Sun exists and has no parent
- At least one body of each type (star, planet, dwarf planet, moon) is present

Use the existing test style in `src/simulation/__tests__/` as a reference — `describe`/`it`/`expect`, no imports needed for those globals (Vitest globals mode is enabled).

After writing the tests, run `npm test` to confirm all tests pass (existing 27 + your new ones).

## Context

- Test runner: Vitest 2 with `globals: true` — no need to import `describe`, `it`, or `expect`
- Existing test files: `src/simulation/__tests__/solarSystemSimulation.test.ts` and `planetViewSimulation.test.ts`
- The loader in `src/data/celestialBodies.ts` exports a typed array or object — import from that, not the raw JSON, so types are enforced in tests
