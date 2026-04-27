import { CELESTIAL_BODIES, VISUAL_CONFIG } from '../data/celestialBodies';
import type { Vec2 } from '../types';

const { orbitalRadii, moonOrbitalRadii, moonSpeedMultiplier } = VISUAL_CONFIG;

const FIXED_IDS = Object.keys(CELESTIAL_BODIES).filter(
  id => CELESTIAL_BODIES[id].type === 'star' || CELESTIAL_BODIES[id].type === 'belt',
);
const PLANET_IDS = Object.keys(orbitalRadii);
const MOON_IDS   = Object.keys(moonOrbitalRadii);

export const SOLAR_BODY_IDS: string[] = [...FIXED_IDS, ...PLANET_IDS, ...MOON_IDS];

const MOON_PARENT_MAP: Record<string, string> = {};
for (const id of MOON_IDS) {
  const parent = CELESTIAL_BODIES[id]?.parent;
  if (parent) MOON_PARENT_MAP[id] = parent;
}

export const ORBITAL_SPEEDS: Record<string, number> = {};
for (const id of FIXED_IDS) ORBITAL_SPEEDS[id] = 0;
for (const id of PLANET_IDS) {
  const body = CELESTIAL_BODIES[id];
  ORBITAL_SPEEDS[id] = body?.orbitalPeriod ? 365.25 / body.orbitalPeriod : 0;
}
for (const id of MOON_IDS) {
  const body = CELESTIAL_BODIES[id];
  if (!body?.orbitalPeriod) { ORBITAL_SPEEDS[id] = 0; continue; }
  const naturalSpeed = (365.25 / Math.abs(body.orbitalPeriod)) * moonSpeedMultiplier;
  const parentSpeed  = MOON_PARENT_MAP[id] ? (ORBITAL_SPEEDS[MOON_PARENT_MAP[id]] ?? 0) : 0;
  // Floor: moon must orbit visibly faster than its parent (guards against slow moons like Earth's)
  ORBITAL_SPEEDS[id] = Math.max(naturalSpeed, parentSpeed * 2) * Math.sign(body.orbitalPeriod);
}

function buildPositions(angles: Record<string, number>, cx: number, cy: number): Record<string, Vec2> {
  const pos: Record<string, Vec2> = {};
  for (const id of FIXED_IDS)  pos[id] = { x: cx, y: cy };
  for (const id of PLANET_IDS) {
    const r = orbitalRadii[id] ?? 0;
    pos[id] = { x: cx + r * Math.cos(angles[id]), y: cy + r * Math.sin(angles[id]) };
  }

  // Non-binary moons: orbit their parent's position, which equals the barycenter for binary parents
  for (const id of MOON_IDS) {
    if (CELESTIAL_BODIES[id]?.binaryMassFraction !== undefined) continue;
    const parentId = MOON_PARENT_MAP[id];
    const pr = moonOrbitalRadii[id] ?? 0;
    const { x: px, y: py } = pos[parentId] ?? { x: cx, y: cy };
    pos[id] = { x: px + pr * Math.cos(angles[id]), y: py + pr * Math.sin(angles[id]) };
  }

  // Binary moons: displace both the moon and its parent away from the barycenter
  for (const id of MOON_IDS) {
    const μ = CELESTIAL_BODIES[id]?.binaryMassFraction;
    if (μ === undefined) continue;
    const parentId = MOON_PARENT_MAP[id];
    if (!parentId) continue;
    const sep = moonOrbitalRadii[id] ?? 0;
    const angle = angles[id];
    const bary = pos[parentId];
    pos[parentId] = { x: bary.x - sep * μ * Math.cos(angle), y: bary.y - sep * μ * Math.sin(angle) };
    pos[id]       = { x: bary.x + sep * (1 - μ) * Math.cos(angle), y: bary.y + sep * (1 - μ) * Math.sin(angle) };
  }

  return pos;
}

export class SolarSystemSimulation {
  angles: Record<string, number>;
  positions: Record<string, Vec2>;

  constructor() {
    this.angles    = Object.fromEntries(SOLAR_BODY_IDS.map((id, i) => [id, i * 0.7]));
    this.positions = Object.fromEntries(SOLAR_BODY_IDS.map(id => [id, { x: 0, y: 0 }]));
  }

  advanceAngles(dt: number, speed: number): void {
    const baseSpeed = 0.25 * speed;
    for (const id of SOLAR_BODY_IDS) {
      this.angles[id] += ORBITAL_SPEEDS[id] * baseSpeed * dt;
    }
  }

  updatePositions(cx: number, cy: number): void {
    this.positions = buildPositions(this.angles, cx, cy);
  }
}
