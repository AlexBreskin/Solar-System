import { CELESTIAL_BODIES, VISUAL_CONFIG } from '../data/celestialBodies';
import type { Vec2, PlanetViewLayout } from '../types';

const TWO_PI = Math.PI * 2;

const { moonOrbitalRadii } = VISUAL_CONFIG;

export const MOON_PARENT_MAP: Record<string, string> = {};
export const MOON_PERIODS: Record<string, number> = {};

for (const id of Object.keys(moonOrbitalRadii)) {
  const body = CELESTIAL_BODIES[id];
  if (!body) continue;
  if (body.parent) MOON_PARENT_MAP[id] = body.parent;
  MOON_PERIODS[id] = body.orbitalPeriod;
}

export function getMoonsOf(planetId: string): string[] {
  return Object.keys(MOON_PARENT_MAP).filter(id => MOON_PARENT_MAP[id] === planetId);
}

export function computeScaledLayout(
  planetId: string,
  moons: string[],
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

  const moonSizes: Record<string, number> = {};
  for (const moonId of moons) {
    const moon = CELESTIAL_BODIES[moonId];
    if (!moon) continue;
    moonSizes[moonId] = Math.max(MIN_MOON_R, (moon.diameter / largestMoonDiam) * MAX_MOON_R);
  }

  const localMoonOrbitalRadii: Record<string, number> = {};
  if (moons.length === 0) return { planetR, moonSizes, moonOrbitalRadii: localMoonOrbitalRadii };

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
    localMoonOrbitalRadii[moonId] = BASE_INNER + t * (FIT_RADIUS - BASE_INNER);
  }

  const MIN_GAP_PAD = 6;
  for (let i = 1; i < sortedMoons.length; i++) {
    const inner = sortedMoons[i - 1];
    const outer = sortedMoons[i];
    const minGap = (moonSizes[inner] ?? 0) + (moonSizes[outer] ?? 0) + MIN_GAP_PAD;
    if ((localMoonOrbitalRadii[outer] ?? 0) - (localMoonOrbitalRadii[inner] ?? 0) < minGap) {
      localMoonOrbitalRadii[outer] = (localMoonOrbitalRadii[inner] ?? 0) + minGap;
    }
  }

  const outermostR = localMoonOrbitalRadii[sortedMoons[sortedMoons.length - 1]] ?? 0;
  if (outermostR > FIT_RADIUS) {
    const scale = FIT_RADIUS / outermostR;
    for (const moonId of sortedMoons) {
      localMoonOrbitalRadii[moonId] = (localMoonOrbitalRadii[moonId] ?? 0) * scale;
    }
  }

  return { planetR, moonSizes, moonOrbitalRadii: localMoonOrbitalRadii };
}

export class PlanetViewSimulation {
  readonly angles: Record<string, number> = {};
  positions: Record<string, Vec2> = {};
  layout: PlanetViewLayout | null = null;

  initMoons(moons: string[]): void {
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

  advanceAngles(dt: number, speed: number, moons: string[]): void {
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
    planetId: string,
    moons: string[],
    cx: number,
    cy: number,
    canvasW: number,
    canvasH: number,
  ): PlanetViewLayout {
    if (!this.layout) this.layout = computeScaledLayout(planetId, moons, canvasW, canvasH);
    const { moonOrbitalRadii: radii } = this.layout;

    // Non-binary moons orbit the barycenter (cx, cy)
    for (const moonId of moons) {
      if (CELESTIAL_BODIES[moonId]?.binaryMassFraction !== undefined) continue;
      const r = radii[moonId] ?? 80;
      const angle = this.angles[moonId] ?? 0;
      this.positions[moonId] = { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
    }

    // Binary moons: displace both the moon and the planet from the barycenter
    let planetX = cx, planetY = cy;
    for (const moonId of moons) {
      const μ = CELESTIAL_BODIES[moonId]?.binaryMassFraction;
      if (μ === undefined) continue;
      const sep = radii[moonId] ?? 80;
      const angle = this.angles[moonId] ?? 0;
      planetX = cx - sep * μ * Math.cos(angle);
      planetY = cy - sep * μ * Math.sin(angle);
      this.positions[moonId] = { x: cx + sep * (1 - μ) * Math.cos(angle), y: cy + sep * (1 - μ) * Math.sin(angle) };
    }
    this.positions[planetId] = { x: planetX, y: planetY };

    return this.layout;
  }
}
