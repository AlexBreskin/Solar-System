# Prompt 8 — Testing Audit and E2E Test Plan

Produce a comprehensive testing health report for this codebase, then plan and implement a Cypress E2E test suite covering the key user flows.

## Current testing baseline

- **Runner**: Vitest 4.x with `globals: true`, `environment: jsdom`
- **Test files**: 7 suites, 794 tests — all unit/integration level
  - `src/data/__tests__/celestialBodies.test.ts` — Sol data shape, hierarchy, visualConfig
  - `src/data/__tests__/exosystems.test.ts` — same checks for every non-Sol system
  - `src/simulation/__tests__/solarSystemSimulation.test.ts`
  - `src/simulation/__tests__/planetViewSimulation.test.ts`
  - `src/simulation/__tests__/galaxySimulation.test.ts`
  - `src/utils/__tests__/distance.test.ts`
  - `src/hooks/__tests__/useZoomControls.test.ts`
- **Coverage provider**: none configured — must be added
- **E2E tests**: none

## Phase 1 — Coverage report

### 1.1 Install the coverage provider

```bash
npm install --save-dev @vitest/coverage-v8
```

Add to `vite.config.ts` inside `test`:

```ts
coverage: {
  provider: "v8",
  reporter: ["text", "html", "json-summary"],
  include: ["src/**/*.{ts,tsx}"],
  exclude: [
    "src/**/__tests__/**",
    "src/main.tsx",
    "src/vite-env.d.ts",
  ],
  thresholds: { lines: 0, functions: 0, branches: 0, statements: 0 },
}
```

Run and capture the output:

```bash
npm run test -- --coverage 2>&1
```

### 1.2 Interpret and report the results

For each source file, report:
| File | Stmts % | Branch % | Funcs % | Lines % | Uncovered lines |
|------|---------|----------|---------|---------|-----------------|
| … | … | … | … | … | … |

Summarise:

- **Overall line coverage** — single percentage across all `src/` files
- **Branch coverage** — which branches (ternaries, if/else, `??`, `&&`) are never exercised
- **Zero-coverage files** — files the existing tests never import at all (likely all of `src/components/` and `src/renderers/`)
- **Best-covered areas** — simulation classes and utility functions
- **Worst-covered areas** — renderers, React components, App.tsx

### 1.3 Code quality scan

Run ESLint and capture the output:

```bash
npx eslint src/ --format stylish 2>&1 | head -100
```

Check TypeScript strict mode:

```bash
npx tsc --noEmit 2>&1
```

Report:

- ESLint error/warning count and top recurring rule violations
- TypeScript errors if any
- Any `// @ts-ignore` or `any` usage that weakens type safety

---

## Phase 2 — E2E test plan with Cypress

### Why Cypress over Playwright or Gherkin

This is a canvas-heavy single-page app built with Vite + React. Cypress is the better fit here because:

- Native component testing support for React (can test components in isolation)
- `cy.get('canvas')` + `cy.trigger('mousedown', { x, y })` for canvas hit-testing
- Excellent Vite plugin (`@cypress/vite-dev-server`) — no separate build step
- Gherkin (Cucumber) adds a BDD layer on top of Cypress; start with plain Cypress first and add Gherkin wrappers only if a non-technical stakeholder needs to read the specs

### 2.1 Install and configure Cypress

```bash
npm install --save-dev cypress @cypress/vite-dev-server
```

Create `cypress.config.ts`:

```ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
  },
});
```

Add to `package.json` scripts:

```json
"cypress:open": "cypress open",
"cypress:run": "cypress run --headless"
```

### 2.2 Test scenarios to implement

Write one `.cy.ts` file per feature area. For each scenario, use `cy.visit('/')` and interact via DOM controls (buttons, selects) where possible; use canvas `cy.trigger` only where unavoidable.

#### `cypress/e2e/01-system-selector.cy.ts`

| Scenario                    | Steps                             | Assert                                           |
| --------------------------- | --------------------------------- | ------------------------------------------------ |
| Default system loads        | visit `/`                         | Header shows "Solar System"; navigator lists Sun |
| Switch to TRAPPIST-1        | select "TRAPPIST-1" from dropdown | Navigator shows "TRAPPIST-1"; info panel updates |
| Switch back to Solar System | select "Solar System"             | State resets, Sun selected                       |

#### `cypress/e2e/02-tabs.cy.ts`

| Scenario                       | Steps                 | Assert                                               |
| ------------------------------ | --------------------- | ---------------------------------------------------- |
| System View is default         | visit `/`             | "System View" tab has `active` class; canvas visible |
| Switch to Planet View          | click "Body View" tab | Planet view canvas visible                           |
| Switch to Galaxy               | click "Galaxy" tab    | Galaxy canvas visible; speed/pause controls hidden   |
| Body View tab hidden in Galaxy | navigate to Galaxy    | "Body View" button not present in DOM                |

#### `cypress/e2e/03-body-navigator.cy.ts`

| Scenario                       | Steps                      | Assert                                                   |
| ------------------------------ | -------------------------- | -------------------------------------------------------- |
| Navigator shows body hierarchy | visit `/`                  | Earth visible in left panel                              |
| Click planet in navigator      | click "Mars" in navigator  | Info panel shows Mars data; header shows "Tracking Mars" |
| Click moon in navigator        | expand Earth, click "Moon" | Planet view auto-switches to show Moon                   |

#### `cypress/e2e/04-info-panel.cy.ts`

| Scenario                | Steps      | Assert                                           |
| ----------------------- | ---------- | ------------------------------------------------ |
| Sun selected by default | visit `/`  | Info panel shows "Sun", mass/radius data visible |
| NASA link present       | select Sun | Info panel contains a link with "NASA" badge     |
| Wikipedia link present  | select Sun | Info panel contains a link with "W" badge        |

#### `cypress/e2e/05-speed-controls.cy.ts`

| Scenario                   | Steps              | Assert                                     |
| -------------------------- | ------------------ | ------------------------------------------ |
| Pause/resume works         | click pause button | Button shows "▶"; clicking again shows "⏸" |
| Speed slider changes value | drag speed slider  | Speed readout value changes                |

#### `cypress/e2e/06-galaxy-view.cy.ts`

| Scenario                  | Steps                                 | Assert                                                 |
| ------------------------- | ------------------------------------- | ------------------------------------------------------ |
| Galaxy tab shows map      | click "Galaxy" tab                    | Galaxy canvas visible; "Regions" button visible        |
| Regions toggle            | click "✦ Regions" button              | Button gains `active` class                            |
| System list in left panel | galaxy tab active                     | Left panel shows system list with "Solar System" entry |
| Select system in list     | click "Alpha Centauri" in list        | Right panel shows system name and distance             |
| Explore system button     | select system with "Explore System →" | Switches to System View with that system loaded        |

#### `cypress/e2e/07-zoom-controls.cy.ts`

| Scenario              | Steps                                | Assert                     |
| --------------------- | ------------------------------------ | -------------------------- |
| Zoom in button works  | click "+" button in System View      | (smoke test — no crash)    |
| Zoom out button works | click "−" button                     | (smoke test — no crash)    |
| Galaxy zoom range     | in Galaxy view, click "+" repeatedly | Does not crash at max zoom |

### 2.3 Canvas interaction helpers

Add to `cypress/support/commands.ts`:

```ts
Cypress.Commands.add(
  "clickCanvas",
  (canvasSelector: string, x: number, y: number) => {
    cy.get(canvasSelector).trigger("mousedown", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
    cy.get(canvasSelector).trigger("mouseup", {
      clientX: x,
      clientY: y,
      bubbles: true,
    });
  },
);
```

Use sparingly — prefer clicking DOM controls (navigator, buttons) over raw canvas coordinates, since canvas pixel positions are fragile across viewport sizes.

---

## Phase 3 — Implement the test suite

### Order of work

1. Install `@vitest/coverage-v8`, run coverage, paste the full table into this document
2. Install Cypress, configure, smoke-test with `cy.visit('/')` passing
3. Implement scenarios in the order listed (01 → 07)
4. After each spec file passes, run the full Vitest suite to confirm no regressions
5. Add `cypress:run` to the CI workflow (`.github/workflows/deploy.yml`) — run headless before the build step

### CI integration

In `.github/workflows/deploy.yml`, add before the build step:

```yaml
- name: Start dev server
  run: npm run dev &
  env:
    CI: true

- name: Wait for server
  run: npx wait-on http://localhost:5173 --timeout 30000

- name: Run Cypress
  run: npm run cypress:run
```

### Definition of done

- `npm test` still passes (794+ tests)
- `npm run test -- --coverage` shows overall line coverage ≥ the baseline measured in Phase 1 (do not regress)
- `npm run cypress:run` exits 0 with all 7 spec files passing
- Coverage HTML report committed to `coverage/` (add to `.gitignore` if preferred)
- ESLint and TypeScript report zero new errors

---

## Key files to read before starting

- `src/App.tsx` — all state, tab logic, system-switching callbacks
- `src/components/BodyNavigator.tsx` / `.css` — left panel DOM structure, class names to target
- `src/components/InfoPanel.tsx` — right panel DOM structure
- `src/components/GalaxyNavigator.tsx` — galaxy left panel
- `src/components/GalaxySystemPanel.tsx` — galaxy right panel
- `vite.config.ts` — existing Vitest config to extend
- `.github/workflows/deploy.yml` — CI pipeline to extend
