import { BodyType, ROOT_BODY_TYPES } from "../types";
import type { CelestialBody, Vec2, VisualConfig } from "../types";

export class SolarSystemSimulation {
  readonly bodyIds: string[];
  readonly orbitalSpeeds: Record<string, number>;
  angles: Record<string, number>;
  positions: Record<string, Vec2>;

  private fixedIds: string[];
  private planetIds: string[];
  private moonIds: string[];
  private moonParentMap: Record<string, string>;
  private orbitalRadii: Record<string, number>;
  private moonOrbitalRadii: Record<string, number>;
  private bodies: Record<string, CelestialBody>;

  constructor(
    bodies: Record<string, CelestialBody>,
    visualConfig: VisualConfig,
  ) {
    this.bodies = bodies;
    const {
      orbitalRadii,
      moonOrbitalRadii,
      moonSpeedMultiplier,
      speedMultiplier,
    } = visualConfig;
    this.orbitalRadii = orbitalRadii;
    this.moonOrbitalRadii = moonOrbitalRadii;

    this.fixedIds = Object.keys(bodies).filter(
      (id) =>
        ROOT_BODY_TYPES.has(bodies[id].type) ||
        bodies[id].type === BodyType.Belt,
    );
    this.planetIds = Object.keys(orbitalRadii);
    this.moonIds = Object.keys(moonOrbitalRadii);
    this.bodyIds = [...this.fixedIds, ...this.planetIds, ...this.moonIds];

    this.moonParentMap = {};
    for (const id of this.moonIds) {
      const parent = bodies[id]?.parent;
      if (parent) this.moonParentMap[id] = parent; // null parent = orphan moon, skip
    }

    this.orbitalSpeeds = {};
    for (const id of this.fixedIds) this.orbitalSpeeds[id] = 0;
    for (const id of this.planetIds) {
      const body = bodies[id];
      this.orbitalSpeeds[id] = body.orbitalPeriod
        ? (365.25 / body.orbitalPeriod) * speedMultiplier
        : 0;
    }
    for (const id of this.moonIds) {
      const body = bodies[id];
      if (!body?.orbitalPeriod) {
        this.orbitalSpeeds[id] = 0;
        continue;
      }
      const naturalSpeed =
        (365.25 / Math.abs(body.orbitalPeriod)) * moonSpeedMultiplier;
      const parentSpeed = this.moonParentMap[id]
        ? this.orbitalSpeeds[this.moonParentMap[id]]
        : 0;
      this.orbitalSpeeds[id] =
        Math.max(naturalSpeed, parentSpeed * 2) * Math.sign(body.orbitalPeriod);
    }

    this.angles = Object.fromEntries(
      this.bodyIds.map((id, i) => [id, i * 0.7]),
    );
    this.positions = Object.fromEntries(
      this.bodyIds.map((id) => [id, { x: 0, y: 0 }]),
    );
  }

  advanceAngles(dt: number, speed: number): void {
    const baseSpeed = 0.25 * speed;
    for (const id of this.bodyIds) {
      this.angles[id] += this.orbitalSpeeds[id] * baseSpeed * dt;
    }
  }

  updatePositions(cx: number, cy: number): void {
    const pos: Record<string, Vec2> = {};
    const fixedSet = new Set(this.fixedIds);

    // 1. Root bodies start at the system barycentre
    for (const id of this.fixedIds) pos[id] = { x: cx, y: cy };

    // 2. Non-binary companions whose parent is a root body (e.g. Proxima Centauri)
    for (const id of this.moonIds) {
      if (this.bodies[id]?.binaryMassFraction !== undefined) continue;
      const parentId = this.moonParentMap[id];
      if (!parentId || !fixedSet.has(parentId)) continue;
      const pr = this.moonOrbitalRadii[id];
      const { x: px, y: py } = pos[parentId];
      pos[id] = {
        x: px + pr * Math.cos(this.angles[id]),
        y: py + pr * Math.sin(this.angles[id]),
      };
    }

    // 3. Binary companions whose parent is a root body — displace both from barycentre
    for (const id of this.moonIds) {
      const μ = this.bodies[id]?.binaryMassFraction;
      if (μ === undefined) continue;
      const parentId = this.moonParentMap[id];
      if (!parentId || !fixedSet.has(parentId)) continue;
      const sep = this.moonOrbitalRadii[id];
      const angle = this.angles[id];
      const bary = pos[parentId];
      pos[parentId] = {
        x: bary.x - sep * μ * Math.cos(angle),
        y: bary.y - sep * μ * Math.sin(angle),
      };
      pos[id] = {
        x: bary.x + sep * (1 - μ) * Math.cos(angle),
        y: bary.y + sep * (1 - μ) * Math.sin(angle),
      };
    }

    // 4. Planets: orbit barycentre for root-type parents,
    //    or the companion's actual position when orbiting a companion star.
    for (const id of this.planetIds) {
      const body = this.bodies[id];
      const r = this.orbitalRadii[id];
      const parentId = body.parent;
      const parentBody = parentId ? this.bodies[parentId] : undefined;
      const centre =
        parentBody && !ROOT_BODY_TYPES.has(parentBody.type) && pos[parentId!]
          ? pos[parentId!]
          : { x: cx, y: cy };
      pos[id] = {
        x: centre.x + r * Math.cos(this.angles[id]),
        y: centre.y + r * Math.sin(this.angles[id]),
      };
    }

    // 5. Non-binary moons of planets (parent is not a root body)
    for (const id of this.moonIds) {
      if (this.bodies[id]?.binaryMassFraction !== undefined) continue;
      if (pos[id] !== undefined) continue; // already placed in step 2
      const parentId = this.moonParentMap[id];
      const pr = this.moonOrbitalRadii[id];
      const { x: px, y: py } = pos[parentId];
      pos[id] = {
        x: px + pr * Math.cos(this.angles[id]),
        y: py + pr * Math.sin(this.angles[id]),
      };
    }

    // 6. Binary moons of planets (e.g. Pluto–Charon) — parent now positioned in step 4
    for (const id of this.moonIds) {
      const μ = this.bodies[id]?.binaryMassFraction;
      if (μ === undefined) continue;
      if (pos[id] !== undefined) continue; // already placed in step 3
      const parentId = this.moonParentMap[id];
      if (!parentId) continue;
      const sep = this.moonOrbitalRadii[id];
      const angle = this.angles[id];
      const bary = pos[parentId];
      pos[parentId] = {
        x: bary.x - sep * μ * Math.cos(angle),
        y: bary.y - sep * μ * Math.sin(angle),
      };
      pos[id] = {
        x: bary.x + sep * (1 - μ) * Math.cos(angle),
        y: bary.y + sep * (1 - μ) * Math.sin(angle),
      };
    }

    this.positions = pos;
  }
}
