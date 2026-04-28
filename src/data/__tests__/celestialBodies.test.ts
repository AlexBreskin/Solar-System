import { CELESTIAL_BODIES, BODY_HIERARCHY, VISUAL_CONFIG } from '../celestialBodies';
import { BodyType } from '../../types';
import type { CelestialBody, HierarchyNode, RingBand, BeltConfig } from '../../types';

// ─── Reusable helpers ────────────────────────────────────────────────────────

const VALID_TYPES = new Set(Object.values(BodyType));

const SI_MASS_RE = /^(\d+(\.\d+)? × 10[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+ kg|Unknown)$/;

export function validateMassFormat(mass: string): void {
  expect(SI_MASS_RE.test(mass)).toBe(true);
}

export function validateBodyShape(body: CelestialBody): void {
  expect(typeof body.id).toBe('string');
  expect(body.id.length).toBeGreaterThan(0);
  expect(typeof body.name).toBe('string');
  expect(body.name.length).toBeGreaterThan(0);
  expect(VALID_TYPES.has(body.type)).toBe(true);
  expect(typeof body.color).toBe('string');
  expect(body.color.length).toBeGreaterThan(0);

  expect(Number.isFinite(body.diameter)).toBe(true);
  expect(body.diameter).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(body.distanceFromParent)).toBe(true);
  expect(body.distanceFromParent).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(body.orbitalPeriod)).toBe(true);
  expect(Number.isFinite(body.rotationPeriod)).toBe(true);
  expect(Number.isFinite(body.eccentricity)).toBe(true);
  expect(body.eccentricity).toBeGreaterThanOrEqual(0);
  expect(body.eccentricity).toBeLessThan(1);
  expect(Number.isFinite(body.inclination)).toBe(true);
  expect(Number.isInteger(body.moons)).toBe(true);
  expect(body.moons).toBeGreaterThanOrEqual(0);

  expect(typeof body.description).toBe('string');
  expect(body.description.length).toBeGreaterThan(0);
  expect(typeof body.funFact).toBe('string');
  expect(body.funFact.length).toBeGreaterThan(0);
  validateMassFormat(body.mass);
}

export function validateRingBand(band: RingBand): void {
  expect(band.innerFactor).toBeGreaterThan(0);
  expect(band.outerFactor).toBeGreaterThan(0);
  expect(band.outerFactor).toBeGreaterThan(band.innerFactor);
  expect(band.intensity).toBeGreaterThan(0);
  expect(band.intensity).toBeLessThanOrEqual(1);
  expect(typeof band.color).toBe('string');
  expect(band.color.length).toBeGreaterThan(0);
}

export function validateBeltConfig(config: BeltConfig): void {
  expect(config.innerRadius).toBeGreaterThan(0);
  expect(config.outerRadius).toBeGreaterThan(0);
  expect(config.outerRadius).toBeGreaterThan(config.innerRadius);
  expect(config.particleCount).toBeGreaterThan(0);
  expect(config.seed).toBeGreaterThan(0);
}

export function flattenHierarchy(nodes: HierarchyNode[]): string[] {
  const ids: string[] = [];
  function walk(n: HierarchyNode) {
    ids.push(n.id);
    for (const child of n.children) walk(child);
  }
  for (const node of nodes) walk(node);
  return ids;
}

// ─── Bodies — shape and required fields ──────────────────────────────────────

describe('CELESTIAL_BODIES — shape and required fields', () => {
  const bodies = Object.values(CELESTIAL_BODIES);

  it('has at least one body', () => {
    expect(bodies.length).toBeGreaterThan(0);
  });

  it('every body passes shape validation', () => {
    for (const body of bodies) {
      validateBodyShape(body);
    }
  });

  it('every body id matches its map key', () => {
    for (const [key, body] of Object.entries(CELESTIAL_BODIES)) {
      expect(body.id).toBe(key);
    }
  });

  it('every body with a parent references an existing id', () => {
    for (const body of bodies) {
      if (body.parent !== null) {
        expect(CELESTIAL_BODIES).toHaveProperty(body.parent);
      }
    }
  });

  it('no body references itself as its parent', () => {
    for (const body of bodies) {
      expect(body.parent).not.toBe(body.id);
    }
  });
});

// ─── Bodies — type-specific rules ────────────────────────────────────────────

describe('CELESTIAL_BODIES — type-specific rules', () => {
  const bodies = Object.values(CELESTIAL_BODIES);

  it('at least one body of each core type is present', () => {
    const coreTypes = [BodyType.Star, BodyType.Planet, BodyType.Moon, BodyType.Belt];
    for (const type of coreTypes) {
      expect(bodies.some(b => b.type === type)).toBe(true);
    }
  });

  it('exactly one star exists and it has no parent', () => {
    const stars = bodies.filter(b => b.type === BodyType.Star);
    expect(stars).toHaveLength(1);
    expect(stars[0].parent).toBeNull();
  });

  it('all planets are direct children of the star', () => {
    const starId = bodies.find(b => b.type === BodyType.Star)!.id;
    for (const body of bodies) {
      if (body.type === BodyType.Planet) {
        expect(body.parent).toBe(starId);
      }
    }
  });

  it('all dwarf-planets are children of the star or a belt', () => {
    const starId = bodies.find(b => b.type === BodyType.Star)!.id;
    for (const body of bodies) {
      if (body.type === BodyType.DwarfPlanet) {
        const parentBody = body.parent ? CELESTIAL_BODIES[body.parent] : null;
        const isValidParent = body.parent === starId || parentBody?.type === BodyType.Belt;
        expect(isValidParent).toBe(true);
      }
    }
  });

  it('all moons have a parent of type planet, dwarf-planet, or asteroid', () => {
    const validParentTypes = new Set([BodyType.Planet, BodyType.DwarfPlanet, BodyType.Asteroid]);
    for (const body of bodies) {
      if (body.type === BodyType.Moon) {
        expect(body.parent).not.toBeNull();
        const parent = CELESTIAL_BODIES[body.parent!];
        expect(parent).toBeDefined();
        expect(validParentTypes.has(parent.type)).toBe(true);
      }
    }
  });

  it('all belt bodies have orbitalPeriod === 0', () => {
    for (const body of bodies) {
      if (body.type === BodyType.Belt) {
        expect(body.orbitalPeriod).toBe(0);
      }
    }
  });
});

// ─── Bodies — optional fields ─────────────────────────────────────────────────

describe('CELESTIAL_BODIES — optional fields', () => {
  const bodies = Object.values(CELESTIAL_BODIES);

  it('nasaUrl, when present, starts with https://', () => {
    for (const body of bodies) {
      if (body.nasaUrl !== undefined) {
        expect(body.nasaUrl).toMatch(/^https:\/\//);
      }
    }
  });

  it('wikipediaUrl, when present, starts with https://', () => {
    for (const body of bodies) {
      if (body.wikipediaUrl !== undefined) {
        expect(body.wikipediaUrl).toMatch(/^https:\/\//);
      }
    }
  });

  it('rings, when present, is a non-empty array of valid RingBands', () => {
    for (const body of bodies) {
      if (body.rings !== undefined) {
        expect(body.rings.length).toBeGreaterThan(0);
        for (const band of body.rings) {
          validateRingBand(band);
        }
      }
    }
  });

  it('binaryMassFraction, when present, is in range (0, 1)', () => {
    for (const body of bodies) {
      if (body.binaryMassFraction !== undefined) {
        expect(body.binaryMassFraction).toBeGreaterThan(0);
        expect(body.binaryMassFraction).toBeLessThan(1);
      }
    }
  });
});

// ─── Hierarchy ────────────────────────────────────────────────────────────────

describe('BODY_HIERARCHY', () => {
  it('is a non-empty array', () => {
    expect(BODY_HIERARCHY.length).toBeGreaterThan(0);
  });

  it('every id in the tree exists in CELESTIAL_BODIES', () => {
    for (const id of flattenHierarchy(BODY_HIERARCHY)) {
      expect(CELESTIAL_BODIES).toHaveProperty(id);
    }
  });

  it('every body in CELESTIAL_BODIES appears exactly once in the tree', () => {
    const flattened = flattenHierarchy(BODY_HIERARCHY);
    const bodyIds = Object.keys(CELESTIAL_BODIES);
    expect(flattened.sort()).toEqual(bodyIds.sort());
    const seen = new Set<string>();
    for (const id of flattened) {
      expect(seen.has(id)).toBe(false);
      seen.add(id);
    }
  });

  it('root nodes are not moons', () => {
    for (const node of BODY_HIERARCHY) {
      const body = CELESTIAL_BODIES[node.id];
      expect(body.type).not.toBe(BodyType.Moon);
    }
  });
});

// ─── VisualConfig ─────────────────────────────────────────────────────────────

describe('VISUAL_CONFIG', () => {
  const bodies = Object.values(CELESTIAL_BODIES);

  it('speedMultiplier and moonSpeedMultiplier are positive numbers', () => {
    expect(VISUAL_CONFIG.speedMultiplier).toBeGreaterThan(0);
    expect(VISUAL_CONFIG.moonSpeedMultiplier).toBeGreaterThan(0);
  });

  it('orbitalRadii has an entry for every planet and dwarf-planet, all positive', () => {
    for (const body of bodies) {
      if (body.type === BodyType.Planet || body.type === BodyType.DwarfPlanet) {
        expect(VISUAL_CONFIG.orbitalRadii).toHaveProperty(body.id);
        expect(VISUAL_CONFIG.orbitalRadii[body.id]).toBeGreaterThan(0);
      }
    }
  });

  it('planetSizes has an entry for every non-belt body, all positive', () => {
    for (const body of bodies) {
      if (body.type !== BodyType.Belt) {
        expect(VISUAL_CONFIG.planetSizes).toHaveProperty(body.id);
        expect(VISUAL_CONFIG.planetSizes[body.id]).toBeGreaterThan(0);
      }
    }
  });

  it('moonOrbitalRadii has an entry for every moon, all positive', () => {
    for (const body of bodies) {
      if (body.type === BodyType.Moon) {
        expect(VISUAL_CONFIG.moonOrbitalRadii).toHaveProperty(body.id);
        expect(VISUAL_CONFIG.moonOrbitalRadii[body.id]).toBeGreaterThan(0);
      }
    }
  });

  it('beltConfigs has an entry for every belt body with a valid config', () => {
    for (const body of bodies) {
      if (body.type === BodyType.Belt) {
        expect(VISUAL_CONFIG.beltConfigs).toHaveProperty(body.id);
        validateBeltConfig(VISUAL_CONFIG.beltConfigs[body.id]);
      }
    }
  });
});

// ─── Cross-consistency ────────────────────────────────────────────────────────

describe('cross-consistency: VisualConfig keys vs CELESTIAL_BODIES', () => {
  it('every orbitalRadii key is a known body id', () => {
    for (const id of Object.keys(VISUAL_CONFIG.orbitalRadii)) {
      expect(CELESTIAL_BODIES).toHaveProperty(id);
    }
  });

  it('every moonOrbitalRadii key is a known body id', () => {
    for (const id of Object.keys(VISUAL_CONFIG.moonOrbitalRadii)) {
      expect(CELESTIAL_BODIES).toHaveProperty(id);
    }
  });

  it('every beltConfigs key is a known body id', () => {
    for (const id of Object.keys(VISUAL_CONFIG.beltConfigs)) {
      expect(CELESTIAL_BODIES).toHaveProperty(id);
    }
  });
});
