import { VISUAL_CONFIG } from '../data/celestialBodies';
import type { BodyId, Vec2 } from '../types';

export const SOLAR_BODY_IDS: BodyId[] = [
  'sun', 'mercury', 'venus', 'earth', 'moon',
  'mars', 'phobos', 'deimos', 'ceres',
  'jupiter', 'io', 'europa', 'ganymede', 'callisto',
  'saturn', 'titan', 'enceladus',
  'uranus', 'neptune', 'triton', 'pluto',
];

export const ORBITAL_SPEEDS: Record<BodyId, number> = {
  sun: 0,
  mercury: 365.25 / 87.97,
  venus:   365.25 / 224.70,
  earth:   1.0,
  mars:    365.25 / 686.97,
  ceres:   365.25 / 1681.63,
  jupiter: 365.25 / 4332.59,
  saturn:  365.25 / 10759.22,
  uranus:  365.25 / 30688.5,
  neptune: 365.25 / 60195,
  pluto:   365.25 / 90560,
  moon:      365.25 / 27.32   * 0.1,
  phobos:    365.25 / 0.319   * 0.05,
  deimos:    365.25 / 1.263   * 0.05,
  io:        365.25 / 1.769   * 0.05,
  europa:    365.25 / 3.551   * 0.05,
  ganymede:  365.25 / 7.155   * 0.05,
  callisto:  365.25 / 16.69   * 0.05,
  titan:     365.25 / 15.95   * 0.05,
  enceladus: 365.25 / 1.37    * 0.05,
  triton:  -(365.25 / 5.877)  * 0.05,
};

const MOON_PARENTS: Partial<Record<BodyId, BodyId>> = {
  moon: 'earth', phobos: 'mars', deimos: 'mars',
  io: 'jupiter', europa: 'jupiter', ganymede: 'jupiter', callisto: 'jupiter',
  titan: 'saturn', enceladus: 'saturn', triton: 'neptune',
};

const PLANETS: BodyId[] = [
  'mercury', 'venus', 'earth', 'mars', 'ceres',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

function buildPositions(
  angles: Record<BodyId, number>,
  cx: number,
  cy: number,
): Record<BodyId, Vec2> {
  const { orbitalRadii, moonOrbitalRadii } = VISUAL_CONFIG;
  const pos: { [k: string]: Vec2 } = {};

  pos['sun'] = { x: cx, y: cy };

  for (const p of PLANETS) {
    const r = orbitalRadii[p] ?? 0;
    pos[p] = { x: cx + r * Math.cos(angles[p]), y: cy + r * Math.sin(angles[p]) };
  }

  for (const [moon, parent] of Object.entries(MOON_PARENTS) as [BodyId, BodyId][]) {
    const pr = moonOrbitalRadii[moon] ?? 0;
    const { x: px, y: py } = pos[parent];
    pos[moon] = { x: px + pr * Math.cos(angles[moon]), y: py + pr * Math.sin(angles[moon]) };
  }

  return pos as Record<BodyId, Vec2>;
}

export class SolarSystemSimulation {
  angles: Record<BodyId, number>;
  positions: Record<BodyId, Vec2>;

  constructor() {
    this.angles = Object.fromEntries(
      SOLAR_BODY_IDS.map((id, i) => [id, i * 0.7]),
    ) as unknown as Record<BodyId, number>;

    this.positions = Object.fromEntries(
      SOLAR_BODY_IDS.map(id => [id, { x: 0, y: 0 }]),
    ) as unknown as Record<BodyId, Vec2>;
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
