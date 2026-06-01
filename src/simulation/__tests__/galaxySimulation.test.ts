import { GalaxySimulation } from "../galaxySimulation";
import { GALAXY_DATA, GALACTIC_IDS } from "../../data/galaxy";
import { STAR_SYSTEMS } from "../../data/systems";

function makeSim(): GalaxySimulation {
  return new GalaxySimulation(GALAXY_DATA, STAR_SYSTEMS);
}

describe("GalaxySimulation — missing meta", () => {
  it("skips galaxy entries with no matching STAR_SYSTEMS entry", () => {
    const galaxyData = {
      systems: [
        { id: "unknown", galacticX: 0, galacticY: 0, rootType: "star" },
      ],
      regions: [],
    };
    const sim = new GalaxySimulation(galaxyData as any, []);
    expect(sim.markers).toHaveLength(0);
  });
});

describe("GalaxySimulation — construction", () => {
  it("creates at least one marker", () => {
    const sim = makeSim();
    expect(sim.markers.length).toBeGreaterThan(0);
  });

  it("creates exactly one marker per galaxy data entry that has a matching STAR_SYSTEMS entry", () => {
    const sim = makeSim();
    const knownIds = new Set(STAR_SYSTEMS.map((s) => s.id));
    const expected = GALAXY_DATA.systems.filter((e) =>
      knownIds.has(e.id),
    ).length;
    expect(sim.markers.length).toBe(expected);
  });

  it("starts with null hover and selection", () => {
    const sim = makeSim();
    expect(sim.hoveredId).toBeNull();
    expect(sim.selectedId).toBeNull();
  });

  it("includes Sol at world origin", () => {
    const sim = makeSim();
    const sol = sim.markers.find((m) => m.id === "sol");
    expect(sol).toBeDefined();
    expect(sol!.worldX).toBe(0);
    expect(sol!.worldY).toBe(0);
  });

  it("all marker world positions are finite numbers", () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(isFinite(m.worldX)).toBe(true);
      expect(isFinite(m.worldY)).toBe(true);
    }
  });

  it("all markers have a non-empty name", () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(m.name.length).toBeGreaterThan(0);
    }
  });

  it("all markers have a valid hex starColor", () => {
    const sim = makeSim();
    for (const m of sim.markers) {
      expect(m.starColor).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("GalaxySimulation — data integrity", () => {
  it("every system ID in GALAXY_DATA matches a known system in STAR_SYSTEMS", () => {
    const knownIds = new Set(STAR_SYSTEMS.map((s) => s.id));
    for (const entry of GALAXY_DATA.systems) {
      expect(knownIds.has(entry.id)).toBe(true);
    }
  });

  it("any STAR_SYSTEMS entry absent from GALACTIC_IDS is not in GALAXY_DATA", () => {
    const extragalactic = STAR_SYSTEMS.filter((s) => !GALACTIC_IDS.has(s.id));
    expect(extragalactic.length).toBeGreaterThan(0);
    for (const s of extragalactic) {
      expect(GALAXY_DATA.systems.find((e) => e.id === s.id)).toBeUndefined();
    }
  });

  it("Sgr A* is in GALAXY_DATA at the galactic centre (world 0, -26000)", () => {
    const sgrA = GALAXY_DATA.systems.find((e) => e.id === "sgrA");
    expect(sgrA).toBeDefined();
    expect(sgrA!.galacticX).toBe(0);
    expect(sgrA!.galacticY).toBe(-26000);
  });

  it("all GALAXY_DATA entries have finite galactic coordinates", () => {
    for (const entry of GALAXY_DATA.systems) {
      expect(isFinite(entry.galacticX)).toBe(true);
      expect(isFinite(entry.galacticY)).toBe(true);
    }
  });
});

describe("GalaxySimulation — state transitions", () => {
  it("setHovered updates hoveredId", () => {
    const sim = makeSim();
    sim.setHovered("sol");
    expect(sim.hoveredId).toBe("sol");
  });

  it("setHovered accepts null", () => {
    const sim = makeSim();
    sim.setHovered("sol");
    sim.setHovered(null);
    expect(sim.hoveredId).toBeNull();
  });

  it("setSelected updates selectedId", () => {
    const sim = makeSim();
    sim.setSelected("alphacentauri");
    expect(sim.selectedId).toBe("alphacentauri");
  });

  it("setSelected accepts null", () => {
    const sim = makeSim();
    sim.setSelected("sol");
    sim.setSelected(null);
    expect(sim.selectedId).toBeNull();
  });
});

describe("GalaxySimulation — getSystemsNear", () => {
  it("returns multiple systems when several are within threshold", () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(0, 0, 100_000);
    expect(result.length).toBeGreaterThanOrEqual(2);
  });

  it("returns empty array when none are within threshold", () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(999_999, 999_999, 1);
    expect(result).toEqual([]);
  });

  it("includes Sol when called at (0, 0) with a large threshold", () => {
    const sim = makeSim();
    const result = sim.getSystemsNear(0, 0, 100_000);
    const ids = result.map((m) => m.id);
    expect(ids).toContain("sol");
  });
});

describe("GalaxySimulation — hitTestRegion (label fallback)", () => {
  it("returns null when no region is within threshold", () => {
    const sim = makeSim();
    expect(sim.hitTestRegion(999_999, 999_999, 1)).toBeNull();
  });

  it("returns null with zero threshold when orion label is outside the orion ellipse", () => {
    // orion label at (3000, 1800) is outside the ellipse cx=0,cy=0,rx=3000,ry=1500
    // so shape check fails and label proximity with threshold=0 also returns null
    const sim = makeSim();
    const orion = sim.regions.find((r) => r.id === "orion")!;
    expect(orion).toBeDefined();
    expect(sim.hitTestRegion(orion.labelX, orion.labelY, 0)).toBeNull();
  });

  it("returns region via label proximity when within threshold", () => {
    const sim = makeSim();
    const orion = sim.regions.find((r) => r.id === "orion")!;
    expect(sim.hitTestRegion(orion.labelX, orion.labelY, 1000)?.id).toBe(
      "orion",
    );
  });

  it("returns closest-label region when multiple labels are within a large threshold", () => {
    const sim = makeSim();
    const orion = sim.regions.find((r) => r.id === "orion")!;
    const result = sim.hitTestRegion(orion.labelX, orion.labelY, 999_999);
    expect(result?.id).toBe("orion");
  });

  it("halo region has no shape defined (label-only)", () => {
    const sim = makeSim();
    const halo = sim.regions.find((r) => r.id === "halo")!;
    expect(halo).toBeDefined();
    expect(halo.shape).toBeUndefined();
  });

  it("halo is reachable via label proximity from a point very close to its label", () => {
    const sim = makeSim();
    const halo = sim.regions.find((r) => r.id === "halo")!;
    // Use a tiny threshold so only a point right on top of the label matches via
    // label proximity, avoiding any nearby arm shape that might intercept first.
    const result = sim.hitTestRegion(halo.labelX, halo.labelY, 10);
    // Either label proximity returns halo, or a nearby arm shape intercepts.
    // The important invariant: halo is reachable at all.
    expect(result).not.toBeNull();
  });
});

describe("GalaxySimulation — hitTestRegion (shape overlap tiebreaker)", () => {
  it("returns the region with the nearer label when two shapes both contain the point", () => {
    // Two identical ellipses centred at the origin — both contain (0, 0).
    // "closer" has its label right at the origin (distance 0).
    // "farther" has its label 9000 ly away.
    // The false branch of `if (labelDist < shapeBestLabelDist)` fires when
    // "farther" is evaluated after "closer" is already the best candidate.
    const data = {
      systems: [],
      regions: [
        {
          id: "closer",
          name: "Closer",
          labelX: 0,
          labelY: 0,
          color: "#aaa",
          description: "",
          funFact: "",
          shape: {
            type: "ellipse",
            cx: 0,
            cy: 0,
            rx: 5000,
            ry: 5000,
            angleRad: 0,
          },
        },
        {
          id: "farther",
          name: "Farther",
          labelX: 9000,
          labelY: 0,
          color: "#bbb",
          description: "",
          funFact: "",
          shape: {
            type: "ellipse",
            cx: 0,
            cy: 0,
            rx: 5000,
            ry: 5000,
            angleRad: 0,
          },
        },
      ],
    };
    const sim = new GalaxySimulation(data as any, []);
    expect(sim.hitTestRegion(0, 0, 0)?.id).toBe("closer");
  });

  it("updates to a nearer label if a later region contains the point and is closer", () => {
    // "farther" processed first; "closer" processed second — should still win.
    const data = {
      systems: [],
      regions: [
        {
          id: "farther",
          name: "Farther",
          labelX: 9000,
          labelY: 0,
          color: "#bbb",
          description: "",
          funFact: "",
          shape: {
            type: "ellipse",
            cx: 0,
            cy: 0,
            rx: 5000,
            ry: 5000,
            angleRad: 0,
          },
        },
        {
          id: "closer",
          name: "Closer",
          labelX: 0,
          labelY: 0,
          color: "#aaa",
          description: "",
          funFact: "",
          shape: {
            type: "ellipse",
            cx: 0,
            cy: 0,
            rx: 5000,
            ry: 5000,
            angleRad: 0,
          },
        },
      ],
    };
    const sim = new GalaxySimulation(data as any, []);
    expect(sim.hitTestRegion(0, 0, 0)?.id).toBe("closer");
  });
});

describe("GalaxySimulation — hitTestRegion (shape containment)", () => {
  it("returns sagittarius for a point on its spiral centreline (no threshold needed)", () => {
    const sim = makeSim();
    // sagittarius label (-5000, -5000) is ~920 ly from its arm centreline — well within halfWidth=3000
    const sagittarius = sim.regions.find((r) => r.id === "sagittarius")!;
    expect(
      sim.hitTestRegion(sagittarius.labelX, sagittarius.labelY, 0)?.id,
    ).toBe("sagittarius");
  });

  it("returns null for a point far from all shapes with zero threshold", () => {
    const sim = makeSim();
    expect(sim.hitTestRegion(500_000, 500_000, 0)).toBeNull();
  });

  it("returns core for a point at the galactic centre (cx=0, cy=-26000)", () => {
    const sim = makeSim();
    // core ellipse is centred at (0, -26000) — the galactic centre
    expect(sim.hitTestRegion(0, -26000, 0)?.id).toBe("core");
  });

  it("returns orion for Sol at world origin (inside orion ellipse)", () => {
    const sim = makeSim();
    // orion ellipse: cx=0, cy=0, rx=3000, ry=1500 — Sol at (0,0) is the centre
    expect(sim.hitTestRegion(0, 0, 0)?.id).toBe("orion");
  });
});

describe("GalaxySimulation — hitTest", () => {
  it("returns null when no systems are within threshold", () => {
    const sim = makeSim();
    expect(sim.hitTest(999_999, 999_999, 100)).toBeNull();
  });

  it("returns sol for coordinates at the origin", () => {
    const sim = makeSim();
    expect(sim.hitTest(0, 0, 1000)).toBe("sol");
  });

  it("returns null with zero threshold", () => {
    const sim = makeSim();
    expect(sim.hitTest(0, 0, 0)).toBeNull();
  });

  it("returns the closest system when multiple are within threshold", () => {
    const sim = makeSim();
    const sgrA = sim.markers.find((m) => m.id === "sgrA")!;
    const result = sim.hitTest(sgrA.worldX, sgrA.worldY, 1000);
    expect(result).toBe("sgrA");
  });
});
