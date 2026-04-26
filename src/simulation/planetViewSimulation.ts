import { CELESTIAL_BODIES } from '../data/celestialBodies';
import type { BodyId, Vec2, PlanetViewLayout } from '../types';

const TWO_PI = Math.PI * 2;

export const MOON_PARENT_MAP: Partial<Record<BodyId, BodyId>> = {
  moon: 'earth', phobos: 'mars', deimos: 'mars',
  io: 'jupiter', europa: 'jupiter', ganymede: 'jupiter', callisto: 'jupiter',
  titan: 'saturn', enceladus: 'saturn', triton: 'neptune',
};

export const MOON_PERIODS: Partial<Record<BodyId, number>> = {
  moon: 27.32, phobos: 0.319, deimos: 1.263,
  io: 1.769, europa: 3.551, ganymede: 7.155, callisto: 16.69,
  titan: 15.95, enceladus: 1.37, triton: -5.877,
};

export function getMoonsOf(planetId: BodyId): BodyId[] {
  return (Object.entries(MOON_PARENT_MAP) as [BodyId, BodyId][])
    .filter(([, parent]) => parent === planetId)
    .map(([moonId]) => moonId);
}

export function computeScaledLayout(
  planetId: BodyId,
  moons: BodyId[],
  canvasW: number,
  canvasH: number,
): PlanetViewLayout {
  const planet = CELESTIAL_BODIES[planetId];
  const halfMin = Math.min(canvasW, canvasH) / 2;

  const MIN_PLANET_R = 28;
  const MAX_PLANET_R = halfMin * 0.22;
  const MIN_MOON_R   = 3;
  const FIT_RADIUS   = halfMin * 0.88;
  const SUN_DIAMETER = 1391016;

  const rawPlanetR = (planet.diameter / SUN_DIAMETER) * MAX_PLANET_R * 18;
  const planetR = Math.max(MIN_PLANET_R, Math.min(MAX_PLANET_R, rawPlanetR));

  const MAX_MOON_R = Math.min(planetR * 0.28, halfMin * 0.08);
  const moonDiameters = moons.map(m => CELESTIAL_BODIES[m]?.diameter ?? 1);
  const largestMoonDiam = moons.length ? Math.max(...moonDiameters) : 1;

  const moonSizes: Partial<Record<BodyId, number>> = {};
  for (const moonId of moons) {
    const moon = CELESTIAL_BODIES[moonId];
    if (!moon) continue;
    moonSizes[moonId] = Math.max(MIN_MOON_R, (moon.diameter / largestMoonDiam) * MAX_MOON_R);
  }

  const moonOrbitalRadii: Partial<Record<BodyId, number>> = {};
  if (moons.length === 0) return { planetR, moonSizes, moonOrbitalRadii };

  const sortedMoons = [...moons].sort(
    (a, b) => (CELESTIAL_BODIES[a]?.distanceFromParent ?? 0) - (CELESTIAL_BODIES[b]?.distanceFromParent ?? 0),
  );

  const realDistances = sortedMoons.map(m => CELESTIAL_BODIES[m]?.distanceFromParent ?? 0);
  const maxRealDist = realDistances[realDistances.length - 1];
  const minRealDist = realDistances[0];
  const distRange   = maxRealDist - minRealDist || 1;
  const BASE_INNER  = planetR + Math.max(planetR * 0.45, 20);

  for (const moonId of sortedMoons) {
    const d = CELESTIAL_BODIES[moonId]?.distanceFromParent ?? 0;
    const t = moons.length === 1 ? 0.5 : (d - minRealDist) / distRange;
    moonOrbitalRadii[moonId] = BASE_INNER + t * (FIT_RADIUS - BASE_INNER);
  }

  const MIN_GAP_PAD = 6;
  for (let i = 1; i < sortedMoons.length; i++) {
    const inner = sortedMoons[i - 1];
    const outer = sortedMoons[i];
    const minGap = (moonSizes[inner] ?? 0) + (moonSizes[outer] ?? 0) + MIN_GAP_PAD;
    if ((moonOrbitalRadii[outer] ?? 0) - (moonOrbitalRadii[inner] ?? 0) < minGap) {
      moonOrbitalRadii[outer] = (moonOrbitalRadii[inner] ?? 0) + minGap;
    }
  }

  const outermostR = moonOrbitalRadii[sortedMoons[sortedMoons.length - 1]] ?? 0;
  if (outermostR > FIT_RADIUS) {
    const scale = FIT_RADIUS / outermostR;
    for (const moonId of sortedMoons) {
      moonOrbitalRadii[moonId] = (moonOrbitalRadii[moonId] ?? 0) * scale;
    }
  }

  return { planetR, moonSizes, moonOrbitalRadii };
}

export class PlanetViewSimulation {
  readonly angles: Partial<Record<BodyId, number>> = {};
  positions: Partial<Record<BodyId, Vec2>> = {};
  layout: PlanetViewLayout | null = null;

  initMoons(moons: BodyId[]): void {
    this.layout = null;
    moons.forEach((m, i) => {
      if (this.angles[m] === undefined) {
        this.angles[m] = i * (TWO_PI / Math.max(moons.length, 1));
      }
    });
  }

  resetLayout(): void {
    this.layout = null;
  }

  advanceAngles(dt: number, speed: number, moons: BodyId[]): void {
    const fastestPeriod = moons.length
      ? Math.min(...moons.map(m => Math.abs(MOON_PERIODS[m] ?? 27.32)))
      : 27.32;

    const baseSpeed = 0.4 * speed;
    for (const moonId of moons) {
      const period = MOON_PERIODS[moonId];
      if (!period) continue;
      const relSpeed = (fastestPeriod / Math.abs(period)) * Math.sign(period);
      this.angles[moonId] = (this.angles[moonId] ?? 0) + relSpeed * baseSpeed * dt;
    }
  }

  updatePositions(
    planetId: BodyId,
    moons: BodyId[],
    cx: number,
    cy: number,
    canvasW: number,
    canvasH: number,
  ): PlanetViewLayout {
    if (!this.layout) this.layout = computeScaledLayout(planetId, moons, canvasW, canvasH);
    const { moonOrbitalRadii } = this.layout;

    this.positions[planetId] = { x: cx, y: cy };
    for (const moonId of moons) {
      const r = moonOrbitalRadii[moonId] ?? 80;
      const angle = this.angles[moonId] ?? 0;
      this.positions[moonId] = {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    }

    return this.layout;
  }
}
