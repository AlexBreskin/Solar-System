import { SolarSystemSimulation, ORBITAL_SPEEDS, SOLAR_BODY_IDS } from '../solarSystemSimulation';

describe('SolarSystemSimulation', () => {
  it('initialises angles for every body', () => {
    const sim = new SolarSystemSimulation();
    for (const id of SOLAR_BODY_IDS) {
      expect(typeof sim.angles[id]).toBe('number');
    }
  });

  it('initialises positions at the origin before any tick', () => {
    const sim = new SolarSystemSimulation();
    for (const id of SOLAR_BODY_IDS) {
      expect(sim.positions[id]).toEqual({ x: 0, y: 0 });
    }
  });

  it('updatePositions places sun at canvas centre', () => {
    const sim = new SolarSystemSimulation();
    sim.updatePositions(400, 300);
    expect(sim.positions['sun']).toEqual({ x: 400, y: 300 });
  });

  it('updatePositions sets a non-zero position for planets', () => {
    const sim = new SolarSystemSimulation();
    sim.updatePositions(400, 300);
    const earth = sim.positions['earth'];
    expect(earth.x).not.toBe(0);
  });

  it('advanceAngles does not change angles when speed is 0', () => {
    const sim = new SolarSystemSimulation();
    const before = { ...sim.angles };
    sim.advanceAngles(0.016, 0);
    for (const id of SOLAR_BODY_IDS) {
      expect(sim.angles[id]).toBeCloseTo(before[id]);
    }
  });

  it('advanceAngles does not move sun (speed 0)', () => {
    const sim = new SolarSystemSimulation();
    const sunBefore = sim.angles['sun'];
    sim.advanceAngles(1, 1);
    expect(sim.angles['sun']).toBeCloseTo(sunBefore + ORBITAL_SPEEDS['sun'] * 0.25);
  });

  it('advanceAngles advances earth faster than pluto', () => {
    const sim = new SolarSystemSimulation();
    const earthBefore = sim.angles['earth'];
    const plutoBefore = sim.angles['pluto'];
    sim.advanceAngles(1, 1);
    const earthDelta = Math.abs(sim.angles['earth'] - earthBefore);
    const plutoDelta = Math.abs(sim.angles['pluto'] - plutoBefore);
    expect(earthDelta).toBeGreaterThan(plutoDelta);
  });

  it('moon positions are offset from their parent planet', () => {
    const sim = new SolarSystemSimulation();
    sim.updatePositions(400, 300);
    const earth = sim.positions['earth'];
    const moon  = sim.positions['moon'];
    const dist = Math.hypot(moon.x - earth.x, moon.y - earth.y);
    expect(dist).toBeGreaterThan(0);
  });

  it('ORBITAL_SPEEDS covers all bodies', () => {
    for (const id of SOLAR_BODY_IDS) {
      expect(typeof ORBITAL_SPEEDS[id]).toBe('number');
    }
  });
});
