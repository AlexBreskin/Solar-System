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
