import { GalaxySimulation } from '../galaxySimulation';
import { GALAXY_DATA, GALACTIC_IDS } from '../../data/galaxy';
import { STAR_SYSTEMS } from '../../data/systems';

function makeSim(): GalaxySimulation {
  return new GalaxySimulation(GALAXY_DATA, STAR_SYSTEMS);
}

describe('GalaxySimulation — construction', () => {
  it('creates at least one marker', () => {
    const sim = makeSim();
    expect(sim.markers.length).toBeGreaterThan(0);
  });

  it('creates exactly one marker per galaxy data entry that has a matching STAR_SYSTEMS entry', () => {
    const sim = makeSim();
    const knownIds = new Set(STAR_SYSTEMS.map(s => s.id));
    const expected = GALAXY_DATA.systems.filter(e => knownIds.has(e.id)).length;
    expect(sim.markers.length).toBe(expected);
  });

  it('starts with null hover and selection', () => {
    const sim = makeSim();
    expect(sim.hoveredId).toBeNull();
    expect(sim.selectedId).toBeNull();
  });

  it('includes Sol at world origin', () => {
    const sim = makeSim();
    const sol = sim.markers.find(m => m.id === 'sol');
    expect(sol).toBeDefined();
    expect(sol!.worldX).toBe(0);
    expect(sol!.worldY).toBe(0);
  });

  it('all marker world positions are finite numbers', () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(isFinite(m.worldX)).toBe(true);
      expect(isFinite(m.worldY)).toBe(true);
    }
  });

  it('all markers have a non-empty name', () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(m.name.length).toBeGreaterThan(0);
    }
  });

  it('all markers have a valid hex starColor', () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(m.starColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe('GalaxySimulation — data integrity', () => {
  it('every system ID in GALAXY_DATA matches a known system in STAR_SYSTEMS', () => {
    const knownIds = new Set(STAR_SYSTEMS.map(s => s.id));
    for (const entry of GALAXY_DATA.systems) {
      expect(knownIds.has(entry.id)).toBe(true);
    }
  });

  it('any STAR_SYSTEMS entry absent from GALACTIC_IDS is not in GALAXY_DATA', () => {
    const extragalactic = STAR_SYSTEMS.filter(s => !GALACTIC_IDS.has(s.id));
    expect(extragalactic.length).toBeGreaterThan(0);
    for (const s of extragalactic) {
      expect(GALAXY_DATA.systems.find(e => e.id === s.id)).toBeUndefined();
    }
  });

  it('Sgr A* is in GALAXY_DATA at the galactic centre (world 0, -26000)', () => {
    const sgrA = GALAXY_DATA.systems.find(e => e.id === 'sgrA');
    expect(sgrA).toBeDefined();
    expect(sgrA!.galacticX).toBe(0);
    expect(sgrA!.galacticY).toBe(-26000);
  });

  it('all GALAXY_DATA entries have finite galactic coordinates', () => {
    for (const entry of GALAXY_DATA.systems) {
      expect(isFinite(entry.galacticX)).toBe(true);
      expect(isFinite(entry.galacticY)).toBe(true);
    }
  });
});

describe('GalaxySimulation — state transitions', () => {
  it('setHovered updates hoveredId', () => {
    const sim = makeSim();
    sim.setHovered('sol');
    expect(sim.hoveredId).toBe('sol');
  });

  it('setHovered accepts null', () => {
    const sim = makeSim();
    sim.setHovered('sol');
    sim.setHovered(null);
    expect(sim.hoveredId).toBeNull();
  });

  it('setSelected updates selectedId', () => {
    const sim = makeSim();
    sim.setSelected('alphacentauri');
    expect(sim.selectedId).toBe('alphacentauri');
  });

  it('setSelected accepts null', () => {
    const sim = makeSim();
    sim.setSelected('sol');
    sim.setSelected(null);
    expect(sim.selectedId).toBeNull();
  });
});

describe('GalaxySimulation — getSystemsNear', () => {
  it('returns multiple systems when several are within threshold', () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(0, 0, 100_000);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it('returns empty array when none are within threshold', () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(999_999, 999_999, 1);
    expect(result).toEqual([]);
  });

  it('includes Sol when called at (0, 0) with a large threshold', () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(0, 0, 100_000);
    const ids = result.map(m => m.id);
    expect(ids).toContain('sol');
  });
});

describe('GalaxySimulation — hitTest', () => {
  it('returns null when no systems are within threshold', () => {
    const sim = makeSim();
    expect(sim.hitTest(999_999, 999_999, 100)).toBeNull();
  });

  it('returns sol for coordinates at the origin', () => {
    const sim = makeSim();
    expect(sim.hitTest(0, 0, 1000)).toBe('sol');
  });

  it('returns null with zero threshold', () => {
    const sim = makeSim();
    expect(sim.hitTest(0, 0, 0)).toBeNull();
  });

  it('returns the closest system when multiple are within threshold', () => {
    const sim = makeSim();
    const sgrA = sim.markers.find(m => m.id === 'sgrA')!;
    const result = sim.hitTest(sgrA.worldX, sgrA.worldY, 1000);
    expect(result).toBe('sgrA');
  });
});
