# Prompt 11 — Constellation Points of Interest

Add a constellation browser to the Galaxy view. Users can select a constellation to see its facts and highlight its member star systems on the galaxy map.

## Architecture overview

- **Data**: `src/data/constellations.json` — static constellation definitions referencing existing system IDs
- **Types**: extend `src/types/galaxy.ts` with a `Constellation` interface; re-export from the barrel
- **Loader**: `src/data/constellations.ts` exports `CONSTELLATIONS`
- **Navigator**: extend `GalaxyNavigator.tsx` to show a collapsible constellation section below the star systems list
- **Info panel**: extend `GalaxySystemPanel.tsx` to render a constellation panel (third selection type alongside system and region)
- **Canvas**: extend `GalaxyCanvas.tsx` to accept a `selectedConstellation` prop and draw a subtle highlight ring around member system markers
- **App state**: add `selectedConstellation: string | null` to the galaxy view state in `App.tsx`

Constellations are a **sky-map / celestial-sphere** grouping — they describe how stars appear from Earth, not galactic structure. Their member systems are scattered across huge galactic distances. Do **not** draw constellation line patterns or labels directly on the galaxy map canvas; highlighting member markers is sufficient.

---

## 1. Data file

Create `src/data/constellations.json`:

```json
{
  "constellations": [
    {
      "id": "orion",
      "name": "Orion",
      "description": "One of the most recognisable constellations in the night sky, Orion the Hunter straddles the celestial equator and is visible worldwide. Its most famous feature is the three-star Orion's Belt asterism, flanked by the red supergiant Betelgeuse and the blue supergiant Rigel.",
      "funFact": "Orion's Belt (Alnitak, Alnilam, and Mintaka) is so well-known that it appears in cultures from the ancient Egyptians to the Aztecs — the three Giza pyramids are often said to mirror its layout.",
      "systems": ["betelgeuse", "rigel"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Orion_(constellation)"
    },
    {
      "id": "cygnus",
      "name": "Cygnus",
      "description": "The Swan flies along the Milky Way in the northern summer sky. Its brightest star, Deneb, sits at one end of the Northern Cross asterism. Cygnus is rich in extraordinary objects: it contains one of the first confirmed stellar black holes, two systems with confirmed exoplanets from the Kepler mission, and 61 Cygni — the first star to have its distance measured via parallax.",
      "funFact": "Cygnus X-1 was the subject of a famous bet between Stephen Hawking and Kip Thorne in 1974 over whether it was truly a black hole. Hawking conceded in 1990.",
      "systems": ["deneb", "61cygni", "cygnusx1", "kepler16", "kepler90"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Cygnus_(constellation)"
    },
    {
      "id": "canis-major",
      "name": "Canis Major",
      "description": "The Greater Dog follows Orion across the sky and is home to Sirius, the brightest star in the entire night sky. The constellation also contains VY Canis Majoris, one of the largest known stars by radius.",
      "funFact": "Sirius appears so dazzling partly because it is only 8.6 light-years away — one of our closest stellar neighbours. VY Canis Majoris, by contrast, is about 3,900 light-years away yet rivals Sirius in naked-eye brightness because it is intrinsically hundreds of thousands of times more luminous.",
      "systems": ["sirius", "vycma"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Canis_Major"
    },
    {
      "id": "scorpius",
      "name": "Scorpius",
      "description": "Scorpius the Scorpion is a summer constellation in the southern sky, dominated by the blood-red supergiant Antares — 'rival of Mars' — at its heart. The constellation is a favourite of southern-hemisphere observers and lies in the direction of the galactic core.",
      "funFact": "Antares is so large that if placed at the centre of our Solar System it would extend beyond the orbit of Mars. It is expected to explode as a supernova within the next ~100,000 years.",
      "systems": ["antares", "gliese667c"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Scorpius"
    },
    {
      "id": "eridanus",
      "name": "Eridanus",
      "description": "The River Eridanus is one of the longest constellations in the sky, winding southward from Orion. It contains two of the most well-studied nearby star systems: Epsilon Eridani, a young K-type star with a debris disc and probable planets, and 40 Eridani, which hosts a remarkable white dwarf companion and is popularly associated with the fictional planet Vulcan.",
      "funFact": "40 Eridani B was the first white dwarf ever discovered, identified in 1783. Its extreme density — a solar mass compressed into an Earth-sized body — puzzled astronomers for over a century before quantum mechanics explained it.",
      "systems": ["epsiloneridani", "40eridani"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Eridanus_(constellation)"
    },
    {
      "id": "carina",
      "name": "Carina",
      "description": "The Keel of the mythological ship Argo, Carina contains Canopus — the second-brightest star in the night sky — and Eta Carinae, one of the most massive and unstable stars known. The Carina Nebula is one of the largest and brightest nebulae in the sky.",
      "funFact": "Eta Carinae underwent a 'Great Eruption' in the 1840s, briefly becoming the second-brightest star in the sky despite being 7,500 light-years away. It ejected material equivalent to ten solar masses and is considered a prime supernova candidate.",
      "systems": ["canopus", "etacarinae"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Carina_(constellation)"
    },
    {
      "id": "lyra",
      "name": "Lyra",
      "description": "The small but prominent constellation of the Lyre is home to Vega, the fifth-brightest star in the night sky and one vertex of the famous Summer Triangle. Vega has been used as a standard reference star for brightness calibration in astronomy.",
      "funFact": "Due to precession of the Earth's axis, Vega was the North Pole star around 12,000 BCE and will be again around 13,700 CE — a 26,000-year cycle known as the precession of the equinoxes.",
      "systems": ["vega"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Lyra"
    },
    {
      "id": "aquila",
      "name": "Aquila",
      "description": "The Eagle soars along the Milky Way in northern summer, its brightest star Altair forming the Southern vertex of the Summer Triangle alongside Vega and Deneb. Altair is one of the closest naked-eye stars to Earth at just 16.7 light-years.",
      "funFact": "Altair rotates so rapidly — once every 9 hours compared to the Sun's 25 days — that it is measurably oblate: it bulges at its equator and is about 20% wider across its equator than from pole to pole.",
      "systems": ["altair"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Aquila_(constellation)"
    },
    {
      "id": "bootes",
      "name": "Boötes",
      "description": "The Herdsman is a large northern constellation best known for Arcturus, the fourth-brightest star in the night sky and the brightest in the northern celestial hemisphere. Arcturus is an orange K-type giant about 36 light-years away on its way out of our galactic neighbourhood at unusually high speed.",
      "funFact": "Arcturus belongs to the 'Arcturus stream' — a group of stars thought to be the remnant of a dwarf galaxy absorbed by the Milky Way billions of years ago, which explains its unusually high proper motion across our sky.",
      "systems": ["arcturus"],
      "wikipediaUrl": "https://en.wikipedia.org/wiki/Bo%C3%B6tes"
    }
  ]
}
```

All referenced system IDs (`betelgeuse`, `rigel`, `deneb`, `61cygni`, `cygnusx1`, `kepler16`, `kepler90`, `sirius`, `vycma`, `antares`, `gliese667c`, `epsiloneridani`, `40eridani`, `canopus`, `etacarinae`, `vega`, `altair`, `arcturus`) are present in `src/data/systems/`.

---

## 2. Types

In `src/types/galaxy.ts` add:

```ts
export interface Constellation {
  id: string;
  name: string;
  description: string;
  funFact: string;
  systems: string[]; // system IDs that belong to this constellation
  wikipediaUrl?: string;
}
```

Re-export from `src/types/index.ts` (already re-exports everything from `galaxy.ts`, so no change needed if using a wildcard export — verify and add explicitly if not).

---

## 3. Data loader

Create `src/data/constellations.ts`:

```ts
import rawData from "./constellations.json";
import type { Constellation } from "../types";

const data = rawData as { constellations: Constellation[] };
export const CONSTELLATIONS: Constellation[] = data.constellations;

// Reverse index: system ID → constellation ID
export const CONSTELLATION_BY_SYSTEM: Record<string, string> = {};
for (const c of CONSTELLATIONS) {
  for (const id of c.systems) {
    CONSTELLATION_BY_SYSTEM[id] = c.id;
  }
}
```

---

## 4. GalaxyNavigator changes

`GalaxyNavigator` needs two additions:

1. A **search/filter input** at the top of the list (filters both systems and constellations simultaneously by name as the user types)
2. A **collapsible "Constellations" section** below the star systems list

### Props to add

```ts
interface GalaxyNavigatorProps {
  // existing props unchanged
  selectedSystem: string | null;
  hoveredSystem: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  // new props
  selectedConstellation: string | null;
  onSelectConstellation: (id: string | null) => void;
}
```

### Search input

At the top of the `.gnav-scroll` area, render a search `<input>`:

```tsx
<input
  className="gnav-search"
  type="search"
  placeholder="Filter systems & constellations…"
  value={query}
  onChange={(e) => setQuery(e.target.value)}
/>
```

Use a `useState<string>("")` hook internally for `query`. When `query` is non-empty:

- Filter galactic/extragalactic system lists: keep entries where `s.name.toLowerCase().includes(query.toLowerCase())`
- Filter constellation list: keep entries where `c.name.toLowerCase().includes(query.toLowerCase())` or any member system name contains the query

When `query` is empty show all items (existing behaviour).

### Constellation section

Below the extragalactic systems section, render:

```tsx
<div className="gnav-section gnav-section--constellations">
  <button
    className="gnav-section-toggle"
    onClick={() => setConstOpen((v) => !v)}
  >
    Constellations <span className="gnav-count">{filtered.length}</span>
    <span className="gnav-chevron">{constOpen ? "▴" : "▾"}</span>
  </button>
</div>;
{
  constOpen &&
    filtered.map((c) => (
      <ConstellationRow
        key={c.id}
        c={c}
        isSelected={selectedConstellation === c.id}
        onSelect={onSelectConstellation}
      />
    ));
}
```

`constOpen` defaults to `true`. `ConstellationRow` renders:

- A `✦` icon
- The constellation name
- A member-count badge (e.g. "5 systems")

```tsx
function ConstellationRow({ c, isSelected, onSelect }) {
  return (
    <div
      className={`gnav-row gnav-row--constellation${isSelected ? " selected" : ""}`}
      onClick={() => onSelect(isSelected ? null : c.id)} // toggle: clicking selected deselects
    >
      <span className="gnav-icon">✦</span>
      <span className="gnav-name">{c.name}</span>
      <span className="gnav-badge">{c.systems.length} systems</span>
    </div>
  );
}
```

Selecting a constellation clears any selected system (call `onSelectSystem` with the current value to keep it, or just manage in App — see App.tsx section).

---

## 5. GalaxySystemPanel changes

`GalaxySystemPanel` already handles `systemId` and `regionId`. Add `constellationId`:

```ts
interface GalaxySystemPanelProps {
  systemId: string | null;
  regionId: string | null;
  constellationId: string | null; // new
  onExplore: (id: string) => void;
  onSelectRegion?: (id: string) => void;
  onSelectSystem?: (id: string) => void; // new — for "explore system" links within constellation panel
}
```

### Constellation panel

When `constellationId` is set and `systemId` and `regionId` are both null, look up the constellation from `CONSTELLATIONS` and render:

```tsx
<div className="galaxy-system-panel">
  <div className="gsp-header">
    <span className="gsp-type-badge gsp-type-badge--constellation">
      <span className="gsp-type-icon">✦</span>
      Constellation
    </span>
  </div>
  <div className="gsp-name">{constellation.name}</div>
  <p className="gsp-description">{constellation.description}</p>
  <div className="gsp-section">
    <div className="gsp-section-title">Fun Fact</div>
    <p className="gsp-fun-fact">{constellation.funFact}</p>
  </div>
  <div className="gsp-section">
    <div className="gsp-section-title">Member Systems</div>
    {memberSystems.map((s) => (
      <button
        key={s.id}
        className="gsp-member-system-btn"
        onClick={() => onSelectSystem?.(s.id)}
      >
        <span style={{ color: s.starColor }}>●</span> {s.name}
      </button>
    ))}
  </div>
  {constellation.wikipediaUrl && (
    <div className="gsp-section">
      <div className="gsp-section-title">Learn More</div>
      <div className="links-list">
        <ExternalLink
          href={constellation.wikipediaUrl}
          badge={<span className="ext-badge wiki-badge">W</span>}
          label="Wikipedia"
        />
      </div>
    </div>
  )}
</div>
```

`memberSystems` is built by looking up each ID in `STAR_SYSTEMS`:

```ts
const memberSystems = constellation.systems
  .map((id) => STAR_SYSTEMS.find((s) => s.id === id))
  .filter(Boolean);
```

### Priority order

The panel renders in this priority: `constellationId` → `regionId` → `systemId` → empty state. This matches the expected UX where clicking a system row clears the constellation selection.

---

## 6. GalaxyCanvas changes

`GalaxyCanvas` needs to know which constellation is selected so it can highlight member system markers.

### New props

```ts
interface GalaxyCanvasProps {
  // existing unchanged
  selectedSystem: string | null;
  hoveredSystem: string | null;
  selectedRegion: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onSelectRegion: (id: string | null) => void;
  // new
  selectedConstellation: string | null;
  constellationSystemIds: Set<string>; // pre-computed by App to avoid lookup in canvas
}
```

### Canvas rendering

Pass `constellationSystemIds` down to `drawSystemMarkers` in `galaxyMarkers.ts`. Add an optional parameter:

```ts
export function drawSystemMarkers(
  ctx,
  markers,
  hoveredId,
  selectedId,
  cx,
  cy,
  panX,
  panY,
  scale,
  ts,
  zoom,
  constellationIds?: Set<string>, // new optional param
): void;
```

Inside `drawSystemMarkers`, for each marker where `constellationIds?.has(m.id)`:

Draw a subtle highlight behind the existing marker — a faint ring in the star's `starColor`:

```ts
if (constellationIds?.has(m.id)) {
  ctx.beginPath();
  ctx.arc(mx, my, r + 5, 0, TWO_PI);
  ctx.strokeStyle = m.starColor + "55";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
```

Draw this **before** the glow and bitmap so it sits underneath.

---

## 7. App.tsx changes

Add state:

```ts
const [selectedConstellation, setSelectedConstellation] = useState<
  string | null
>(null);
```

Wire up `GalaxyNavigator`:

```tsx
<GalaxyNavigator
  selectedSystem={selectedSystem}
  hoveredSystem={hoveredSystem}
  onSelectSystem={(id) => {
    setSelectedSystem(id);
    setSelectedConstellation(null);
  }}
  onHoverSystem={setHoveredSystem}
  selectedConstellation={selectedConstellation}
  onSelectConstellation={setSelectedConstellation}
/>
```

Wire up `GalaxySystemPanel`:

```tsx
<GalaxySystemPanel
  systemId={selectedSystem}
  regionId={selectedRegion}
  constellationId={selectedConstellation}
  onExplore={(id) => {
    setSelectedSystem(id);
    setActiveTab("solar-system");
  }}
  onSelectRegion={setSelectedRegion}
  onSelectSystem={(id) => {
    setSelectedSystem(id);
    setSelectedConstellation(null);
  }}
/>
```

Compute `constellationSystemIds` with `useMemo`:

```ts
const constellationSystemIds = useMemo(() => {
  if (!selectedConstellation) return new Set<string>();
  const c = CONSTELLATIONS.find((c) => c.id === selectedConstellation);
  return new Set(c?.systems ?? []);
}, [selectedConstellation]);
```

Pass to `GalaxyCanvas`:

```tsx
<GalaxyCanvas
  ...existing props...
  selectedConstellation={selectedConstellation}
  constellationSystemIds={constellationSystemIds}
/>
```

Selecting a constellation should NOT clear the map's `selectedRegion` — constellations and regions are independent. Selecting a region or system should clear `selectedConstellation`.

---

## 8. CSS

### `GalaxyNavigator.css` additions

```css
.gnav-search {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 4px;
  color: #d8e8ff;
  font-family: Syne, sans-serif;
  font-size: 12px;
  outline: none;
}
.gnav-search::placeholder {
  color: rgba(200, 215, 255, 0.35);
}
.gnav-search:focus {
  border-color: rgba(180, 210, 255, 0.3);
}

.gnav-section-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  font: inherit;
  color: inherit;
  text-align: left;
}
.gnav-chevron {
  margin-left: auto;
  opacity: 0.5;
}

.gnav-row--constellation .gnav-icon {
  color: rgba(200, 215, 255, 0.6);
}
```

### `GalaxySystemPanel.css` additions

```css
.gsp-type-badge--constellation {
  color: rgba(200, 215, 255, 0.9);
}

.gsp-member-system-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  padding: 6px 10px;
  margin-bottom: 4px;
  cursor: pointer;
  color: rgba(200, 215, 240, 0.9);
  font-family: Syne, sans-serif;
  font-size: 12px;
  text-align: left;
  transition: background 0.15s;
}
.gsp-member-system-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #ffffff;
}
```

---

## 9. Tests

Add `src/data/__tests__/constellations.test.ts`:

```ts
import { CONSTELLATIONS, CONSTELLATION_BY_SYSTEM } from "../constellations";
import { STAR_SYSTEMS } from "../systems";

describe("constellations data", () => {
  const systemIds = new Set(STAR_SYSTEMS.map((s) => s.id));

  it("has at least 5 constellations", () => {
    expect(CONSTELLATIONS.length).toBeGreaterThanOrEqual(5);
  });

  it("every constellation has a non-empty id, name, description, funFact, and systems array", () => {
    for (const c of CONSTELLATIONS) {
      expect(c.id).toBeTruthy();
      expect(c.name).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.funFact).toBeTruthy();
      expect(c.systems.length).toBeGreaterThan(0);
    }
  });

  it("all referenced system IDs exist in STAR_SYSTEMS", () => {
    for (const c of CONSTELLATIONS) {
      for (const id of c.systems) {
        expect(systemIds.has(id)).toBe(true);
      }
    }
  });

  it("CONSTELLATION_BY_SYSTEM reverse index is consistent", () => {
    for (const [systemId, constId] of Object.entries(CONSTELLATION_BY_SYSTEM)) {
      const c = CONSTELLATIONS.find((c) => c.id === constId);
      expect(c?.systems).toContain(systemId);
    }
  });

  it("no system ID appears in more than one constellation", () => {
    const seen = new Set<string>();
    for (const c of CONSTELLATIONS) {
      for (const id of c.systems) {
        expect(seen.has(id)).toBe(false);
        seen.add(id);
      }
    }
  });
});
```

Note: this test uses `import.meta.glob` transitively through `STAR_SYSTEMS` — the same pre-existing issue that blocks other data tests. If those tests remain failing, this one will also fail until the `import.meta` issue is resolved. Do not attempt to fix that issue as part of this task.

---

## 10. Implementation order

1. `constellations.json` data file
2. `Constellation` type in `galaxy.ts`, re-exported
3. `constellations.ts` loader + reverse index
4. Test file (run to confirm the `import.meta` blocker is the only failure, not a data error)
5. `GalaxyNavigator` — search input + constellation section
6. `GalaxySystemPanel` — constellation panel + `onSelectSystem` prop
7. `galaxyMarkers.ts` — add `constellationIds` param to `drawSystemMarkers`
8. `GalaxyCanvas` — new props wired to renderer
9. `App.tsx` — state + memoised set + props wiring
10. CSS additions
11. Final TypeScript check: `npx tsc --noEmit`
12. Run tests: `npx react-scripts test --watchAll=false`
13. Update README

---

## 11. README update

Add a "Constellations" subsection under the Galaxy View section:

```
**Constellations** — the left navigator lists 9 constellation groupings (Orion, Cygnus,
Canis Major, Scorpius, Eridanus, Carina, Lyra, Aquila, Boötes). Selecting a constellation
highlights its member systems on the galaxy map with a ring overlay and shows the constellation's
description, fun fact, and member-system links in the info panel. The navigator search box
(see below) filters both star systems and constellations simultaneously.
```

---

## Completion criteria

- [ ] Constellation section visible in the galaxy left-side navigator
- [ ] Clicking a constellation: highlights its member systems on the map (ring overlay), shows constellation info panel
- [ ] Constellation panel shows: name, description, fun fact, member-system buttons (clicking one navigates to that system), Wikipedia link
- [ ] Search input filters both star systems and constellations
- [ ] Selecting a system from within the constellation panel closes the constellation panel and shows the system panel
- [ ] `npx tsc --noEmit` produces no errors
- [ ] `npx react-scripts test --watchAll=false` — 42 existing tests still pass; new constellation test blocked only by pre-existing `import.meta` issue
- [ ] README updated
