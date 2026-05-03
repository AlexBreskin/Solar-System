import { BodyType, ROOT_BODY_TYPES } from '../../types';
import type { CelestialBody, HierarchyNode, StarSystemMeta } from '../../types';
import type { VisualConfig } from '../../types/visual';
import { validateBodyShape, validateRingBand, flattenHierarchy } from './celestialBodies.test';

type RawSystem = {
  system?: StarSystemMeta;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
};

const allModules = import.meta.glob('../systems/*.json', { eager: true }) as Record<string, RawSystem>;

const exosystems = Object.entries(allModules)
  .filter(([path]) => !path.endsWith('/sol.json'))
  .map(([path, data]) => ({
    id: data.system?.id ?? path,
    name: data.system?.name ?? path,
    data,
  }));

// Navigable systems have full bodies/hierarchy/visualConfig data.
// Non-navigable stubs only carry a "system" metadata block.
const navigableExosystems = exosystems.filter(
  ({ data }) => data.system?.navigable !== false,
);

describe('exosystems — at least 6 non-Sol systems are present', () => {
  it('discovers 6 or more exosystem files', () => {
    expect(exosystems.length).toBeGreaterThanOrEqual(6);
  });
});

describe.each(exosystems)('$name — system metadata', ({ data }) => {
  it('has a "system" block with id, name, description, starColor', () => {
    expect(data.system).toBeDefined();
    expect(typeof data.system!.id).toBe('string');
    expect(data.system!.id.length).toBeGreaterThan(0);
    expect(typeof data.system!.name).toBe('string');
    expect(data.system!.name.length).toBeGreaterThan(0);
    expect(typeof data.system!.description).toBe('string');
    expect(data.system!.description.length).toBeGreaterThan(0);
    expect(typeof data.system!.starColor).toBe('string');
    expect(data.system!.starColor).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe.each(navigableExosystems)('$name — bodies shape', ({ data }) => {
  const bodies = Object.values(data.bodies);

  it('has at least one body', () => {
    expect(bodies.length).toBeGreaterThan(0);
  });

  it('every body passes shape validation', () => {
    for (const body of bodies) {
      validateBodyShape(body);
    }
  });

  it('every body id matches its map key', () => {
    for (const [key, body] of Object.entries(data.bodies)) {
      expect(body.id).toBe(key);
    }
  });

  it('every body with a parent references an existing id', () => {
    for (const body of bodies) {
      if (body.parent !== null) {
        expect(data.bodies).toHaveProperty(body.parent);
      }
    }
  });

  it('no body references itself as its parent', () => {
    for (const body of bodies) {
      expect(body.parent).not.toBe(body.id);
    }
  });

  it('exactly one root body (star, black hole, neutron star, or quasar) with no parent', () => {
    const roots = bodies.filter(b => ROOT_BODY_TYPES.has(b.type));
    expect(roots).toHaveLength(1);
    expect(roots[0].parent).toBeNull();
  });

  it('all planets are direct children of the root body', () => {
    const rootId = bodies.find(b => ROOT_BODY_TYPES.has(b.type))!.id;
    for (const body of bodies) {
      if (body.type === BodyType.Planet) {
        expect(body.parent).toBe(rootId);
      }
    }
  });

  it('rings, when present, are non-empty arrays of valid bands', () => {
    for (const body of bodies) {
      if (body.rings !== undefined) {
        expect(body.rings.length).toBeGreaterThan(0);
        for (const band of body.rings) {
          validateRingBand(band);
        }
      }
    }
  });

  it('all url fields, when present, start with https://', () => {
    for (const body of bodies) {
      if (body.nasaUrl) expect(body.nasaUrl).toMatch(/^https:\/\//);
      if (body.wikipediaUrl) expect(body.wikipediaUrl).toMatch(/^https:\/\//);
    }
  });
});

describe.each(navigableExosystems)('$name — hierarchy', ({ data }) => {
  it('is a non-empty array', () => {
    expect(data.hierarchy.length).toBeGreaterThan(0);
  });

  it('every id in the tree exists in bodies', () => {
    for (const id of flattenHierarchy(data.hierarchy)) {
      expect(data.bodies).toHaveProperty(id);
    }
  });

  it('every body appears exactly once in the hierarchy', () => {
    const flattened = flattenHierarchy(data.hierarchy);
    const bodyIds = Object.keys(data.bodies);
    expect(flattened.sort()).toEqual(bodyIds.sort());
  });
});

describe.each(navigableExosystems)('$name — visualConfig', ({ data }) => {
  const { visualConfig, bodies } = data;
  const allBodies = Object.values(bodies);

  it('speedMultiplier and moonSpeedMultiplier are positive', () => {
    expect(visualConfig.speedMultiplier).toBeGreaterThan(0);
    expect(visualConfig.moonSpeedMultiplier).toBeGreaterThan(0);
  });

  it('orbitalRadii has an entry for every planet, all positive', () => {
    for (const body of allBodies) {
      if (body.type === BodyType.Planet) {
        expect(visualConfig.orbitalRadii).toHaveProperty(body.id);
        expect(visualConfig.orbitalRadii[body.id]).toBeGreaterThan(0);
      }
    }
  });

  it('every orbitalRadii key is a known body id', () => {
    for (const id of Object.keys(visualConfig.orbitalRadii)) {
      expect(bodies).toHaveProperty(id);
    }
  });
});
