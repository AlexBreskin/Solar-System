import { BodyType, ROOT_BODY_TYPES } from "../types";
import type { CelestialBody, Vec2, VisualConfig } from "../types";

interface SimInit {
  bodies: Record<string, CelestialBody>;
  fixedIds: string[];
  planetIds: string[];
  moonIds: string[];
  moonParentMap: Record<string, string>;
  orbitalRadii: Record<string, number>;
  moonOrbitalRadii: Record<string, number>;
  orbitalSpeeds: Record<string, number>;
}

export class SolarSystemSimulation {
  readonly bodyIds: string[];
  readonly orbitalSpeeds: Record<string, number>;
  angles: Record<string, number>;
  positions: Record<string, Vec2>;

  private fixedIds: string[];
  private planetIds: string[];
  private binaryMoonIds: string[];
  private nonBinaryMoonIds: string[];
  private moonParentMap: Record<string, string>;
  private orbitalRadii: Record<string, number>;
  private moonOrbitalRadii: Record<string, number>;
  private bodies: Record<string, CelestialBody>;

  private constructor(init: SimInit) {
    this.bodies = init.bodies;
    this.fixedIds = init.fixedIds;
    this.planetIds = init.planetIds;
    this.moonParentMap = init.moonParentMap;
    this.orbitalRadii = init.orbitalRadii;
    this.moonOrbitalRadii = init.moonOrbitalRadii;
    this.orbitalSpeeds = init.orbitalSpeeds;
    this.binaryMoonIds = init.moonIds.filter(
      (id) => init.bodies[id]?.binaryMassFraction !== undefined,
    );
    this.nonBinaryMoonIds = init.moonIds.filter(
      (id) => init.bodies[id]?.binaryMassFraction === undefined,
    );
    this.bodyIds = [...init.fixedIds, ...init.planetIds, ...init.moonIds];
    this.angles = Object.fromEntries(
      this.bodyIds.map((id, i) => [id, i * 0.7]),
    );
    this.positions = Object.fromEntries(
      this.bodyIds.map((id) => [id, { x: 0, y: 0 }]),
    );
  }

  static create(
    bodies: Record<string, CelestialBody>,
    visualConfig: VisualConfig,
  ): SolarSystemSimulation {
    const {
      orbitalRadii,
      moonOrbitalRadii,
      moonSpeedMultiplier,
      speedMultiplier,
    } = visualConfig;
    const fixedIds = Object.keys(bodies).filter(
      (id) =>
        ROOT_BODY_TYPES.has(bodies[id].type) ||
        bodies[id].type === BodyType.Belt,
    );
    const planetIds = Object.keys(orbitalRadii);
    const moonIds = Object.keys(moonOrbitalRadii);
    const moonParentMap: Record<string, string> = Object.fromEntries(
      moonIds
        .filter((id) => bodies[id]?.parent)
        .map((id) => [id, bodies[id].parent!]),
    );
    const orbitalSpeeds = SolarSystemSimulation.buildOrbitalSpeeds(
      fixedIds,
      planetIds,
      moonIds,
      moonParentMap,
      bodies,
      speedMultiplier,
      moonSpeedMultiplier,
    );
    return new SolarSystemSimulation({
      bodies,
      fixedIds,
      planetIds,
      moonIds,
      moonParentMap,
      orbitalRadii,
      moonOrbitalRadii,
      orbitalSpeeds,
    });
  }

  private static buildOrbitalSpeeds(
    fixedIds: string[],
    planetIds: string[],
    moonIds: string[],
    moonParentMap: Record<string, string>,
    bodies: Record<string, CelestialBody>,
    speedMultiplier: number,
    moonSpeedMultiplier: number,
  ): Record<string, number> {
    const fixed = Object.fromEntries(fixedIds.map((id) => [id, 0]));
    const planet = Object.fromEntries(
      planetIds.map((id) => {
        const body = bodies[id];
        return [
          id,
          body.orbitalPeriod
            ? (365.25 / body.orbitalPeriod) * speedMultiplier
            : 0,
        ];
      }),
    );
    const moon = Object.fromEntries(
      moonIds.map((id) => {
        const body = bodies[id];
        if (!body?.orbitalPeriod) return [id, 0];
        const naturalSpeed =
          (365.25 / Math.abs(body.orbitalPeriod)) * moonSpeedMultiplier;
        const parentSpeed = planet[moonParentMap[id]] ?? 0;
        return [
          id,
          Math.max(naturalSpeed, parentSpeed * 2) *
            Math.sign(body.orbitalPeriod),
        ];
      }),
    );
    return { ...fixed, ...planet, ...moon };
  }

  advanceAngles(dt: number, speed: number): void {
    const baseSpeed = 0.25 * speed;
    for (const id of this.bodyIds) {
      this.angles[id] += this.orbitalSpeeds[id] * baseSpeed * dt;
    }
  }

  private resolveOrbitCentre(
    planetId: string,
    cx: number,
    cy: number,
    pos: Record<string, Vec2>,
  ): Vec2 {
    const body = this.bodies[planetId];
    const parentId = body.parent;
    const parentBody = parentId ? this.bodies[parentId] : undefined;
    if (parentBody && !ROOT_BODY_TYPES.has(parentBody.type) && pos[parentId!]) {
      return pos[parentId!];
    }
    return { x: cx, y: cy };
  }

  private placeOrbiting(pos: Record<string, Vec2>, id: string): void {
    const parentId = this.moonParentMap[id];
    if (!parentId) return;
    const { x: px, y: py } = pos[parentId];
    const pr = this.moonOrbitalRadii[id];
    pos[id] = {
      x: px + pr * Math.cos(this.angles[id]),
      y: py + pr * Math.sin(this.angles[id]),
    };
  }

  private placeBinary(pos: Record<string, Vec2>, id: string): void {
    const parentId = this.moonParentMap[id];
    if (!parentId) return;
    const massFraction = this.bodies[id].binaryMassFraction!;
    const sep = this.moonOrbitalRadii[id];
    const angle = this.angles[id];
    const bary = pos[parentId];
    pos[parentId] = {
      x: bary.x - sep * massFraction * Math.cos(angle),
      y: bary.y - sep * massFraction * Math.sin(angle),
    };
    pos[id] = {
      x: bary.x + sep * (1 - massFraction) * Math.cos(angle),
      y: bary.y + sep * (1 - massFraction) * Math.sin(angle),
    };
  }

  // Steps 2-3: companions of root bodies (non-binary first so binary displacement
  // happens after non-binary orbit positions are fixed).
  private placeCompanions(
    pos: Record<string, Vec2>,
    fixedSet: Set<string>,
  ): void {
    for (const id of this.nonBinaryMoonIds) {
      const parentId = this.moonParentMap[id];
      if (!parentId || !fixedSet.has(parentId)) continue;
      this.placeOrbiting(pos, id);
    }
    for (const id of this.binaryMoonIds) {
      const parentId = this.moonParentMap[id];
      if (!parentId || !fixedSet.has(parentId)) continue;
      this.placeBinary(pos, id);
    }
  }

  // Steps 5-6: moons of planets (already positioned in step 4).
  private placePlanetMoons(pos: Record<string, Vec2>): void {
    for (const id of this.nonBinaryMoonIds) {
      if (pos[id] !== undefined) continue; // already placed as a companion in step 2
      this.placeOrbiting(pos, id);
    }
    for (const id of this.binaryMoonIds) {
      if (pos[id] !== undefined) continue; // already placed as a companion in step 3
      this.placeBinary(pos, id);
    }
  }

  updatePositions(cx: number, cy: number): void {
    const pos: Record<string, Vec2> = {};
    const fixedSet = new Set(this.fixedIds);

    // 1. Root bodies start at the system barycentre
    for (const id of this.fixedIds) pos[id] = { x: cx, y: cy };

    // 2-3. Companions of root bodies (non-binary, then binary)
    this.placeCompanions(pos, fixedSet);

    // 4. Planets: orbit barycentre for root-type parents,
    //    or the companion's actual position when orbiting a companion star.
    for (const id of this.planetIds) {
      const r = this.orbitalRadii[id];
      const centre = this.resolveOrbitCentre(id, cx, cy, pos);
      pos[id] = {
        x: centre.x + r * Math.cos(this.angles[id]),
        y: centre.y + r * Math.sin(this.angles[id]),
      };
    }

    // 5-6. Moons of planets (non-binary, then binary)
    this.placePlanetMoons(pos);

    this.positions = pos;
  }
}
