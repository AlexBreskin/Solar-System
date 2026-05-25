import {
  PlanetViewSimulation,
  getMoonsOf,
  computeScaledLayout,
  MOON_PARENT_MAP,
  MOON_PERIODS,
} from "../planetViewSimulation";
import { CELESTIAL_BODIES } from "../../data/celestialBodies";

describe("getMoonsOf", () => {
  it("returns correct moons for earth", () => {
    expect(getMoonsOf("earth", CELESTIAL_BODIES)).toEqual(["moon"]);
  });

  it("returns correct moons for mars", () => {
    const moons = getMoonsOf("mars", CELESTIAL_BODIES);
    expect(moons).toContain("phobos");
    expect(moons).toContain("deimos");
    expect(moons).toHaveLength(2);
  });

  it("returns 4 galilean moons for jupiter", () => {
    expect(getMoonsOf("jupiter", CELESTIAL_BODIES)).toHaveLength(4);
  });

  it("returns empty array for a body with no moons", () => {
    expect(getMoonsOf("mercury", CELESTIAL_BODIES)).toEqual([]);
    expect(getMoonsOf("venus", CELESTIAL_BODIES)).toEqual([]);
  });

  it("every entry in MOON_PARENT_MAP is returned by getMoonsOf its parent", () => {
    for (const [moon, parent] of Object.entries(MOON_PARENT_MAP) as [
      string,
      string,
    ][]) {
      expect(getMoonsOf(parent, CELESTIAL_BODIES)).toContain(moon);
    }
  });
});

describe("computeScaledLayout", () => {
  const W = 800;
  const H = 600;

  it("returns a positive planetR", () => {
    const { planetR } = computeScaledLayout(
      "earth",
      ["moon"],
      W,
      H,
      CELESTIAL_BODIES,
    );
    expect(planetR).toBeGreaterThan(0);
  });

  it("planet with no moons returns empty radii maps", () => {
    const layout = computeScaledLayout("mercury", [], W, H, CELESTIAL_BODIES);
    expect(Object.keys(layout.moonOrbitalRadii)).toHaveLength(0);
    expect(Object.keys(layout.moonSizes)).toHaveLength(0);
  });

  it("all moons appear in moonOrbitalRadii and moonSizes", () => {
    const moons = getMoonsOf("jupiter", CELESTIAL_BODIES);
    const layout = computeScaledLayout(
      "jupiter",
      moons,
      W,
      H,
      CELESTIAL_BODIES,
    );
    for (const m of moons) {
      expect(layout.moonOrbitalRadii[m]).toBeGreaterThan(0);
      expect(layout.moonSizes[m]).toBeGreaterThan(0);
    }
  });

  it("outer moons have larger orbital radii than inner moons", () => {
    const layout = computeScaledLayout(
      "jupiter",
      getMoonsOf("jupiter", CELESTIAL_BODIES),
      W,
      H,
      CELESTIAL_BODIES,
    );
    const ioR = layout.moonOrbitalRadii["io"] ?? 0;
    const callistoR = layout.moonOrbitalRadii["callisto"] ?? 0;
    expect(callistoR).toBeGreaterThan(ioR);
  });

  it("all moon radii fit within the canvas half-min", () => {
    const moons = getMoonsOf("saturn", CELESTIAL_BODIES);
    const layout = computeScaledLayout("saturn", moons, W, H, CELESTIAL_BODIES);
    const halfMin = Math.min(W, H) / 2;
    for (const m of moons) {
      expect(layout.moonOrbitalRadii[m] ?? 0).toBeLessThanOrEqual(halfMin);
    }
  });
});

describe("PlanetViewSimulation", () => {
  it("initMoons populates angles for new moons", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    expect(typeof sim.angles["moon"]).toBe("number");
  });

  it("initMoons does not overwrite already-set angles", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    const before = sim.angles["moon"];
    sim.initMoons(["moon"]);
    expect(sim.angles["moon"]).toBe(before);
  });

  it("updatePositions places the planet at canvas centre", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    sim.updatePositions("earth", ["moon"], 400, 300, 800, 600);
    expect(sim.positions["earth"]).toEqual({ x: 400, y: 300 });
  });

  it("updatePositions reuses cached layout on second call", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    const layout1 = sim.updatePositions("earth", ["moon"], 400, 300, 800, 600);
    const layout2 = sim.updatePositions("earth", ["moon"], 400, 300, 800, 600);
    expect(layout1).toBe(layout2);
  });

  it("advanceAngles skips moons with orbitalPeriod 0", () => {
    const bodies = {
      ...CELESTIAL_BODIES,
      frozen: {
        ...CELESTIAL_BODIES["moon"],
        id: "frozen",
        orbitalPeriod: 0,
      },
    };
    const sim = new PlanetViewSimulation(bodies);
    sim.initMoons(["frozen"]);
    const before = sim.angles["frozen"];
    sim.advanceAngles(1, 1, ["frozen"]);
    expect(sim.angles["frozen"]).toBe(before);
  });

  it("updatePositions sets a position for each moon", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    const moons = getMoonsOf("jupiter", CELESTIAL_BODIES);
    sim.initMoons(moons);
    sim.updatePositions("jupiter", moons, 400, 300, 800, 600);
    for (const m of moons) {
      expect(sim.positions[m]).toBeDefined();
    }
  });

  it("advanceAngles with no moons uses default fastest period and does not throw", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.advanceAngles(1, 1, []);
  });

  it("advanceAngles does nothing when speed is 0", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    const before = sim.angles["moon"] ?? 0;
    sim.advanceAngles(1, 0, ["moon"]);
    expect(sim.angles["moon"]).toBeCloseTo(before);
  });

  it("advanceAngles moves moon angles when speed > 0", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons(["moon"]);
    const before = sim.angles["moon"] ?? 0;
    sim.advanceAngles(1, 1, ["moon"]);
    expect(sim.angles["moon"]).not.toBeCloseTo(before);
  });

  it("triton has a negative period (retrograde)", () => {
    expect(MOON_PERIODS["triton"] ?? 0).toBeLessThan(0);
  });

  it("resetLayout clears the cached layout", () => {
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    const moons = getMoonsOf("earth", CELESTIAL_BODIES);
    sim.initMoons(moons);
    sim.updatePositions("earth", moons, 400, 300, 800, 600);
    expect(sim.layout).not.toBeNull();
    sim.resetLayout();
    expect(sim.layout).toBeNull();
  });

  it("updatePositions handles a binary moon (binaryMassFraction)", () => {
    const binaryBody = Object.values(CELESTIAL_BODIES).find(
      (b) => b.binaryMassFraction !== undefined && b.parent !== null,
    );
    expect(binaryBody).toBeDefined();
    const parentId = binaryBody!.parent!;
    const sim = new PlanetViewSimulation(CELESTIAL_BODIES);
    sim.initMoons([binaryBody!.id]);
    sim.updatePositions(parentId, [binaryBody!.id], 400, 300, 800, 600);
    expect(sim.positions[binaryBody!.id]).toBeDefined();
    expect(sim.positions[parentId]).toBeDefined();
    // Parent is displaced from centre in a binary system
    const pos = sim.positions[parentId];
    const dist = Math.hypot(pos.x - 400, pos.y - 300);
    expect(dist).toBeGreaterThan(0);
  });
});

describe("computeScaledLayout — FIT_RADIUS scale-down", () => {
  it("scales orbits down to fit the canvas when moons are widely spaced", () => {
    // Tiny canvas forces FIT_RADIUS to be very small, triggering the scale-down path
    const W = 50;
    const H = 50;
    const FIT_RADIUS = (Math.min(W, H) / 2) * 0.88;
    const moons = getMoonsOf("saturn", CELESTIAL_BODIES);
    expect(moons.length).toBeGreaterThan(1);
    const layout = computeScaledLayout("saturn", moons, W, H, CELESTIAL_BODIES);
    for (const m of moons) {
      expect(layout.moonOrbitalRadii[m] ?? 0).toBeLessThanOrEqual(
        FIT_RADIUS + 0.01,
      );
    }
  });
});
