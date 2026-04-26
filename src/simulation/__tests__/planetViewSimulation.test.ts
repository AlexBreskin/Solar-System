import {
  PlanetViewSimulation,
  getMoonsOf,
  computeScaledLayout,
  MOON_PARENT_MAP,
  MOON_PERIODS,
} from '../planetViewSimulation';

describe('getMoonsOf', () => {
  it('returns correct moons for earth', () => {
    expect(getMoonsOf('earth')).toEqual(['moon']);
  });

  it('returns correct moons for mars', () => {
    const moons = getMoonsOf('mars');
    expect(moons).toContain('phobos');
    expect(moons).toContain('deimos');
    expect(moons).toHaveLength(2);
  });

  it('returns 4 galilean moons for jupiter', () => {
    expect(getMoonsOf('jupiter')).toHaveLength(4);
  });

  it('returns empty array for a body with no moons', () => {
    expect(getMoonsOf('mercury')).toEqual([]);
    expect(getMoonsOf('venus')).toEqual([]);
  });

  it('every entry in MOON_PARENT_MAP is returned by getMoonsOf its parent', () => {
    for (const [moon, parent] of Object.entries(MOON_PARENT_MAP) as [string, string][]) {
      expect(getMoonsOf(parent as Parameters<typeof getMoonsOf>[0])).toContain(moon);
    }
  });
});

describe('computeScaledLayout', () => {
  const W = 800, H = 600;

  it('returns a positive planetR', () => {
    const { planetR } = computeScaledLayout('earth', ['moon'], W, H);
    expect(planetR).toBeGreaterThan(0);
  });

  it('planet with no moons returns empty radii maps', () => {
    const layout = computeScaledLayout('mercury', [], W, H);
    expect(Object.keys(layout.moonOrbitalRadii)).toHaveLength(0);
    expect(Object.keys(layout.moonSizes)).toHaveLength(0);
  });

  it('all moons appear in moonOrbitalRadii and moonSizes', () => {
    const moons = getMoonsOf('jupiter');
    const layout = computeScaledLayout('jupiter', moons, W, H);
    for (const m of moons) {
      expect(layout.moonOrbitalRadii[m]).toBeGreaterThan(0);
      expect(layout.moonSizes[m]).toBeGreaterThan(0);
    }
  });

  it('outer moons have larger orbital radii than inner moons', () => {
    const layout = computeScaledLayout('jupiter', getMoonsOf('jupiter'), W, H);
    // io is innermost, callisto is outermost
    const ioR       = layout.moonOrbitalRadii['io'] ?? 0;
    const callistoR = layout.moonOrbitalRadii['callisto'] ?? 0;
    expect(callistoR).toBeGreaterThan(ioR);
  });

  it('all moon radii fit within the canvas half-min', () => {
    const moons = getMoonsOf('saturn');
    const layout = computeScaledLayout('saturn', moons, W, H);
    const halfMin = Math.min(W, H) / 2;
    for (const m of moons) {
      expect(layout.moonOrbitalRadii[m] ?? 0).toBeLessThanOrEqual(halfMin);
    }
  });
});

describe('PlanetViewSimulation', () => {
  it('initMoons populates angles for new moons', () => {
    const sim = new PlanetViewSimulation();
    sim.initMoons(['moon']);
    expect(typeof sim.angles['moon']).toBe('number');
  });

  it('initMoons does not overwrite already-set angles', () => {
    const sim = new PlanetViewSimulation();
    sim.initMoons(['moon']);
    const before = sim.angles['moon'];
    sim.initMoons(['moon']);
    expect(sim.angles['moon']).toBe(before);
  });

  it('updatePositions places the planet at canvas centre', () => {
    const sim = new PlanetViewSimulation();
    sim.initMoons(['moon']);
    sim.updatePositions('earth', ['moon'], 400, 300, 800, 600);
    expect(sim.positions['earth']).toEqual({ x: 400, y: 300 });
  });

  it('updatePositions sets a position for each moon', () => {
    const sim = new PlanetViewSimulation();
    const moons = getMoonsOf('jupiter');
    sim.initMoons(moons);
    sim.updatePositions('jupiter', moons, 400, 300, 800, 600);
    for (const m of moons) {
      expect(sim.positions[m]).toBeDefined();
    }
  });

  it('advanceAngles does nothing when speed is 0', () => {
    const sim = new PlanetViewSimulation();
    sim.initMoons(['moon']);
    const before = sim.angles['moon'] ?? 0;
    sim.advanceAngles(1, 0, ['moon']);
    expect(sim.angles['moon']).toBeCloseTo(before);
  });

  it('advanceAngles moves moon angles when speed > 0', () => {
    const sim = new PlanetViewSimulation();
    sim.initMoons(['moon']);
    const before = sim.angles['moon'] ?? 0;
    sim.advanceAngles(1, 1, ['moon']);
    expect(sim.angles['moon']).not.toBeCloseTo(before);
  });

  it('triton has a negative period (retrograde)', () => {
    expect((MOON_PERIODS['triton'] ?? 0)).toBeLessThan(0);
  });

  it('resetLayout clears the cached layout', () => {
    const sim = new PlanetViewSimulation();
    const moons = getMoonsOf('earth');
    sim.initMoons(moons);
    sim.updatePositions('earth', moons, 400, 300, 800, 600);
    expect(sim.layout).not.toBeNull();
    sim.resetLayout();
    expect(sim.layout).toBeNull();
  });
});
