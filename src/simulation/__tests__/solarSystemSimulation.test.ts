import { SolarSystemSimulation } from "../solarSystemSimulation";
import { CELESTIAL_BODIES, VISUAL_CONFIG } from "../../data/celestialBodies";
import { BodyType } from "../../types";
import type { CelestialBody, VisualConfig } from "../../types";

function makeBody(
  id: string,
  type: BodyType,
  overrides: Partial<CelestialBody> = {},
): CelestialBody {
  return {
    id,
    type,
    name: id,
    color: "#ffffff",
    orbitalPeriod: 365,
    rotationPeriod: 24,
    diameter: 10_000,
    distanceFromParent: 1,
    eccentricity: 0,
    inclination: 0,
    moons: 0,
    parent: null,
    mass: "1 × 10²⁴ kg",
    description: "test",
    funFact: "test",
    ...overrides,
  } as CelestialBody;
}

function makeVisualConfig(overrides: Partial<VisualConfig> = {}): VisualConfig {
  return {
    orbitalRadii: {},
    moonOrbitalRadii: {},
    planetSizes: {},
    speedMultiplier: 1,
    moonSpeedMultiplier: 1,
    beltConfigs: {},
    ...overrides,
  };
}

describe("SolarSystemSimulation", () => {
  function makeSim() {
    return new SolarSystemSimulation(CELESTIAL_BODIES, VISUAL_CONFIG);
  }

  it("initialises angles for every body", () => {
    const sim = makeSim();
    for (const id of sim.bodyIds) {
      expect(typeof sim.angles[id]).toBe("number");
    }
  });

  it("initialises positions at the origin before any tick", () => {
    const sim = makeSim();
    for (const id of sim.bodyIds) {
      expect(sim.positions[id]).toEqual({ x: 0, y: 0 });
    }
  });

  it("updatePositions places sun at canvas centre", () => {
    const sim = makeSim();
    sim.updatePositions(400, 300);
    expect(sim.positions["sun"]).toEqual({ x: 400, y: 300 });
  });

  it("updatePositions sets a non-zero position for planets", () => {
    const sim = makeSim();
    sim.updatePositions(400, 300);
    const earth = sim.positions["earth"];
    expect(earth.x).not.toBe(0);
  });

  it("advanceAngles does not change angles when speed is 0", () => {
    const sim = makeSim();
    const before = { ...sim.angles };
    sim.advanceAngles(0.016, 0);
    for (const id of sim.bodyIds) {
      expect(sim.angles[id]).toBeCloseTo(before[id]);
    }
  });

  it("advanceAngles does not move sun", () => {
    const sim = makeSim();
    const sunBefore = sim.angles["sun"];
    sim.advanceAngles(1, 1);
    expect(sim.angles["sun"]).toBeCloseTo(
      sunBefore + sim.orbitalSpeeds["sun"] * 0.25,
    );
  });

  it("advanceAngles advances earth faster than pluto", () => {
    const sim = makeSim();
    const earthBefore = sim.angles["earth"];
    const plutoBefore = sim.angles["pluto"];
    sim.advanceAngles(1, 1);
    const earthDelta = Math.abs(sim.angles["earth"] - earthBefore);
    const plutoDelta = Math.abs(sim.angles["pluto"] - plutoBefore);
    expect(earthDelta).toBeGreaterThan(plutoDelta);
  });

  it("moon positions are offset from their parent planet", () => {
    const sim = makeSim();
    sim.updatePositions(400, 300);
    const earth = sim.positions["earth"];
    const moon = sim.positions["moon"];
    const dist = Math.hypot(moon.x - earth.x, moon.y - earth.y);
    expect(dist).toBeGreaterThan(0);
  });

  it("orbitalSpeeds covers all bodies", () => {
    const sim = makeSim();
    for (const id of sim.bodyIds) {
      expect(typeof sim.orbitalSpeeds[id]).toBe("number");
    }
  });
});

describe("SolarSystemSimulation — edge case bodies", () => {
  it("assigns zero orbital speed to a planet with orbitalPeriod 0", () => {
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      frozen: makeBody("frozen", BodyType.Planet, {
        parent: "star",
        orbitalPeriod: 0,
      }),
    };
    const vc = makeVisualConfig({
      orbitalRadii: { frozen: 100 },
      planetSizes: { star: 20, frozen: 10 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    expect(sim.orbitalSpeeds["frozen"]).toBe(0);
  });

  it("assigns correct orbital speed to a parentless moon (parentSpeed = 0)", () => {
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      stray: makeBody("stray", BodyType.Moon, {
        parent: null,
        orbitalPeriod: 30,
      }),
    };
    const vc = makeVisualConfig({
      moonOrbitalRadii: { stray: 40 },
      planetSizes: { star: 20, stray: 5 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    expect(sim.orbitalSpeeds["stray"]).toBeGreaterThan(0);
  });

  it("skips step-6 placement for a binary moon with no parent", () => {
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      orphanbinary: makeBody("orphanbinary", BodyType.Moon, {
        parent: null,
        orbitalPeriod: 30,
        binaryMassFraction: 0.3,
      }),
    };
    const vc = makeVisualConfig({
      moonOrbitalRadii: { orphanbinary: 40 },
      planetSizes: { star: 20, orphanbinary: 5 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    sim.updatePositions(400, 300);
    // No crash; binary orphan moon is skipped in step 6
    expect(sim.positions["star"]).toBeDefined();
  });

  it("places a parentless planet at the barycentre", () => {
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      rogue: makeBody("rogue", BodyType.Planet, {
        parent: null,
        orbitalPeriod: 365,
      }),
    };
    const vc = makeVisualConfig({
      orbitalRadii: { rogue: 100 },
      planetSizes: { star: 20, rogue: 10 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    sim.updatePositions(400, 300);
    expect(sim.positions["rogue"]).toBeDefined();
  });
});

describe("SolarSystemSimulation — zero-period moon", () => {
  it("assigns zero orbital speed to a moon with orbitalPeriod 0", () => {
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      planet: makeBody("planet", BodyType.Planet, {
        parent: "star",
        orbitalPeriod: 365,
      }),
      zeromoon: makeBody("zeromoon", BodyType.Moon, {
        parent: "planet",
        orbitalPeriod: 0,
      }),
    };
    const vc = makeVisualConfig({
      orbitalRadii: { planet: 100 },
      moonOrbitalRadii: { zeromoon: 40 },
      planetSizes: { star: 20, planet: 10, zeromoon: 5 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    expect(sim.orbitalSpeeds["zeromoon"]).toBe(0);
  });
});

describe("SolarSystemSimulation — companion star positions", () => {
  it("positions a non-binary companion orbiting the root star", () => {
    // Covers updatePositions step 2: non-binary moon whose parent is in fixedSet
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      companion: makeBody("companion", BodyType.Companion, {
        parent: "star",
        orbitalPeriod: 365,
      }),
    };
    const vc = makeVisualConfig({
      moonOrbitalRadii: { companion: 200 },
      planetSizes: { star: 20, companion: 10 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    sim.updatePositions(400, 300);
    expect(sim.positions["companion"]).toBeDefined();
    const dist = Math.hypot(
      sim.positions["companion"].x - 400,
      sim.positions["companion"].y - 300,
    );
    expect(dist).toBeGreaterThan(0);
  });

  it("displaces both bodies when companion has binaryMassFraction", () => {
    // Covers updatePositions step 3: binary companion whose parent is in fixedSet
    const bodies = {
      star: makeBody("star", BodyType.Star, { orbitalPeriod: 0 }),
      companion: makeBody("companion", BodyType.Companion, {
        parent: "star",
        orbitalPeriod: 365,
        binaryMassFraction: 0.4,
      }),
    };
    const vc = makeVisualConfig({
      moonOrbitalRadii: { companion: 200 },
      planetSizes: { star: 20, companion: 10 },
    });
    const sim = new SolarSystemSimulation(bodies, vc);
    sim.updatePositions(400, 300);
    expect(sim.positions["companion"]).toBeDefined();
    expect(sim.positions["star"]).toBeDefined();
    // Both bodies are displaced from the barycentre
    const starDist = Math.hypot(
      sim.positions["star"].x - 400,
      sim.positions["star"].y - 300,
    );
    expect(starDist).toBeGreaterThan(0);
  });
});
