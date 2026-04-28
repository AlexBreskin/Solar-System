# Prompt 7 — Galaxy View Refinements

Refine the existing Galaxy View tab (`src/components/GalaxyCanvas.tsx`) with improved UX, visual polish, and smarter interaction patterns.

## Current state

- `src/components/GalaxyCanvas.tsx` — canvas + "Beyond the Milky Way" sidebar panel
- `src/renderers/galaxyRenderer.ts` — `drawGalaxyBackground()` (spiral + disk + bulge), `drawSystemMarkers()`
- `src/simulation/galaxySimulation.ts` — `GalaxySimulation` class with markers, `hitTest()`, hover/select state
- `src/data/galaxy.json` — 13 Milky Way systems with galactic coordinates
- `src/types/galaxy.ts` — `GalacticSystemEntry`, `GalaxyData`, `EXTRAGALACTIC_IDS`
- `src/App.tsx` — Galaxy tab wired alongside System View and Body View tabs; speed/pause/labels controls always visible
- `src/components/BodyNavigator.tsx` — shows full body hierarchy; always rendered in the left panel regardless of active tab

## What to implement

### 1. Zoom-dependent levels of detail

The galaxy view should adapt its rendering to the current zoom level. Define three tiers in the renderer:

**Galaxy scale** (`zoom ≤ 0.5`): full Milky Way visible
- Draw the full spiral background (current behaviour)
- Star field background: sparse, small dots widely spread
- System markers: small dots only, no labels except Sol and the currently selected/hovered system
- Spiral arm paths: full opacity

**Neighbourhood scale** (`0.5 < zoom ≤ 8`): Orion Arm region
- Fade out the spiral arm paths as zoom increases (opacity ∝ 1/zoom, floor at 0)
- Star field: denser, slightly larger dots (we are "zooming into" the local neighbourhood)
- System markers: normal size with labels on hover/select; Sol always labelled
- Central bulge and galactic disk gradient: fade out at this zoom tier (galaxy centre is off-screen)

**Local scale** (`zoom > 8`): individual system positions
- No spiral background drawn (too zoomed in to see galaxy structure)
- Rich star field: many stars at varied sizes, simulating the local stellar neighbourhood
- System markers: large, clearly labelled; show distance in light-years under each label
- Hint text: "You are viewing the Solar neighbourhood"

Pass the current `zoom` value into `drawGalaxyBackground()` and `drawSystemMarkers()` and use it to gate rendering decisions. Cache the star field arrays separately from the galaxy particle arrays (different seeds, different counts).

### 2. Hide Body View tab and speed/pause controls when on Galaxy tab

In `src/App.tsx`:
- Render the "Body View" tab button only when `activeTab !== 'galaxy'`
- Render the pause button (`⏸ / ▶`) and speed slider only when `activeTab !== 'galaxy'`
- The Orbits and Labels toggle buttons already only show for specific tabs — follow the same pattern

### 3. Replace left panel with system list in Galaxy view

When `activeTab === 'galaxy'`, render a `<GalaxyNavigator>` component in the left panel instead of `<BodyNavigator>`.

Create `src/components/GalaxyNavigator.tsx` and `GalaxyNavigator.css`:

**Layout:**
```
STAR SYSTEMS                       [16]
────────────────────────────────────
☀  Solar System            0.0 ly  ←
☀  Alpha Centauri          4.4 ly
☀  Tau Ceti               11.9 ly
☀  Gliese 667C            23.6 ly
☀  TRAPPIST-1             40.7 ly
  ...
✵  3C 273                  2.4 Bly
✵  TON 618                10.4 Bly
```

- List ALL 16 systems (both Milky Way and extragalactic), sorted ascending by `distanceFromEarth` from `StarSystemMeta`
- Sol at the top (distance 0)
- Extragalactic systems at the bottom (their distances are very large)
- Each row: root-type icon, system name, formatted distance
- Use `formatLY()` from `src/utils/distance.ts` for the distance column
- Clicking a row: **select** the system (highlight its marker, show info in right panel) — do NOT switch tab or load the system
- The selected system row is highlighted (use the same `.selected` / `.active` styling as BodyNavigator)
- Hovering a row highlights the corresponding map marker

**Props:**
```ts
interface GalaxyNavigatorProps {
  selectedSystem: string | null;
  hoveredSystem: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
}
```

In `src/App.tsx`:
- Add `galaxySelectedSystem: string | null` state (initially `null`, separate from `selectedBody`)
- Add `galaxyHoveredSystem: string | null` state
- When `activeTab === 'galaxy'`: render `<GalaxyNavigator>` in the left panel
- Otherwise: render `<BodyNavigator>` as today

### 4. System selection shows info in right panel — does not navigate immediately

**Current behaviour:** clicking a marker calls `onSelectSystem(id)` → loads the system → switches to System View.

**New behaviour:**
- Single click on an unclustered marker: select the system (update `galaxySelectedSystem`), show system info in the right panel — do NOT switch tabs or load the system
- The right panel displays a `<GalaxySystemPanel>` when `activeTab === 'galaxy'`
- `<GalaxySystemPanel>` shows system-level info: name, root-type badge, distance from Earth, short description, body count, and an **"Explore System →"** button
- Clicking "Explore System →": load the system and switch to System View (same as the old click behaviour — calls `handleSystemChange(id)`)

Create `src/components/GalaxySystemPanel.tsx` and `GalaxySystemPanel.css`:

```ts
interface GalaxySystemPanelProps {
  systemId: string | null;       // currently selected system in galaxy view
  onExplore: (id: string) => void; // load system + switch to System View
}
```

If `systemId` is null: show a placeholder ("Select a system to see details").

Data to display (all available from `StarSystemMeta` + `GALAXY_DATA`):
- System name and root type (use `rootType` from galaxy.json entry)
- Distance from Earth (`distanceFromEarth` from `StarSystemMeta`)
- Description (`StarSystemMeta.description`)
- Whether it has navigable detail (all current systems do — future systems with no detail would disable the button)
- "Explore System →" button (primary action)

In `src/App.tsx`:
- When `activeTab === 'galaxy'`: render `<GalaxySystemPanel systemId={galaxySelectedSystem} onExplore={handleSystemChange} />` in the right panel
- Otherwise: render `<InfoPanel>` as today

### 5. Clustered system selection dropdown

When multiple systems are within a screen-pixel threshold of each other at the current zoom (because they are physically close — e.g., Sol neighbourhood systems at low zoom), a single click should not guess — it should show a small popup menu listing all candidates.

**Implementation:**

In `GalaxyCanvas.tsx` / `GalaxySimulation`:
- Add `getSystemsNear(worldX, worldY, lyThreshold): GalaxyMarker[]` to `GalaxySimulation` — returns all markers within range, not just the closest
- In `handleMouseUp`: if 2+ systems are within the hit radius at the current zoom, set a `clusterMenu: { x: number; y: number; systems: GalaxyMarker[] } | null` state instead of selecting directly

Render the dropdown as an absolutely-positioned HTML div over the canvas:
```tsx
{clusterMenu && (
  <div className="galaxy-cluster-menu" style={{ left: clusterMenu.x, top: clusterMenu.y }}>
    {clusterMenu.systems.map(s => (
      <button key={s.id} onClick={() => { onSelectSystem(s.id); setClusterMenu(null); }}>
        <span>{rootTypeIcon(s.rootType)}</span>
        {s.name}
      </button>
    ))}
  </div>
)}
```

Dismiss the menu on any canvas drag or second click outside it.

The hit-radius threshold for clustering: `24 / scale` light-years (same as the current single-system threshold). If multiple systems fall within this radius, show the menu.

### 6. Spiral arm visual improvement

The current spiral looks like concentric rings with faint particles. Improve it:

**Structural changes to `galaxyRenderer.ts`:**
- Draw 2 **major** arms and 2 **minor** arms with different widths and particle counts (not 4 identical arms)
- Major arms: 2000 particles each, arm width multiplier 1.0
- Minor arms: 800 particles each, arm width multiplier 0.55, offset +π/4 from adjacent major arm
- Add arm colour variation: particles closer to galactic centre are warmer (yellow-white); outer arm particles are cooler (blue-white)
- Add a subtle inter-arm dust lane: thin dark ellipse paths at r ≈ 8,000 ly and r ≈ 22,000 ly (just `ctx.strokeStyle = 'rgba(0,0,0,0.12)'` stroked arcs)
- Widen the scatter per particle from `r * 0.1` to `r * 0.15` so arms have more natural feathering
- Bulge: reduce max size from `5000 * scale` to `3500 * scale` so it doesn't overwhelm at medium zoom

**Particle colouring by galactic radius:**
```ts
function armParticleColor(r: number): string {
  if (r < 5000) return '#FFE8B0'; // warm inner
  if (r < 15000) return '#D8E4FF'; // neutral mid
  return '#B0C8FF'; // cool outer
}
```

Apply this in the particle draw loop (bucket by color instead of global `fillStyle`).

### 7. Sync hover between GalaxyNavigator and GalaxyCanvas

- Hovering a row in `GalaxyNavigator` → sets `galaxyHoveredSystem` → passed to `GalaxyCanvas` as a prop → `sim.setHovered(id)` on change
- Hovering a marker in `GalaxyCanvas` → calls `onHoverSystem(id)` → sets `galaxyHoveredSystem` → reflected in the navigator row

Use a `useEffect` in `GalaxyCanvas` that calls `sim.setHovered(hoveredSystem)` whenever the `hoveredSystem` prop changes.

## Files to create

- `src/components/GalaxyNavigator.tsx`
- `src/components/GalaxyNavigator.css`
- `src/components/GalaxySystemPanel.tsx`
- `src/components/GalaxySystemPanel.css`

## Files to modify

- `src/renderers/galaxyRenderer.ts` — zoom-aware rendering, spiral visual improvements
- `src/simulation/galaxySimulation.ts` — add `getSystemsNear()`
- `src/components/GalaxyCanvas.tsx` — cluster menu, bidirectional hover, pass zoom to renderer, selection without navigation
- `src/App.tsx` — new state (`galaxySelectedSystem`, `galaxyHoveredSystem`), conditional tab/control visibility, panel switching

## Test requirements

Add to `src/simulation/__tests__/galaxySimulation.test.ts`:
- `getSystemsNear` returns multiple systems when several are within threshold
- `getSystemsNear` returns empty array when none are within threshold
- `getSystemsNear` includes Sol when called at (0, 0) with a large threshold

Run `npm test` — all existing tests (368) plus new ones must pass.

## Smoke test checklist

- Galaxy tab active: Body View tab is hidden, speed/pause controls are hidden
- Left panel shows system list sorted by distance; hovering a row highlights the canvas marker
- Clicking a row or marker selects it; right panel shows system info with "Explore System →" button
- "Explore System →" loads the system and switches to System View
- At low zoom, nearby systems (Sol neighbourhood) show a cluster menu on click; menu dismisses on drag
- Spiral arms have 2 distinct major arms + 2 minor arms with warm inner / cool outer colouring
- Zoom in past ×8: spiral fades, rich star field appears
- Zoom out below ×0.5: full galaxy visible with sparse star field
- All 368+ tests pass
