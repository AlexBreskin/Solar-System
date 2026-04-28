export type BodyId = string;

export enum BodyType {
  Star = 'star',
  Planet = 'planet',
  DwarfPlanet = 'dwarf-planet',
  Moon = 'moon',
  Asteroid = 'asteroid',
  Belt = 'belt',
  Companion = 'companion',
}

export interface RingBand {
  innerFactor: number;
  outerFactor: number;
  color: string;
  intensity: number;
}

export interface CelestialBody {
  id: BodyId;
  name: string;
  type: BodyType;
  parent: BodyId | null;
  diameter: number;
  mass: string;
  distanceFromParent: number;
  orbitalPeriod: number;
  rotationPeriod: number;
  eccentricity: number;
  inclination: number;
  color: string;
  glowColor?: string;
  rings?: RingBand[];
  showOrbitRing?: boolean;
  atmosphereColor?: string;
  binaryMassFraction?: number;
  description: string;
  surfaceTemp: string;
  moons: number;
  funFact: string;
  atmosphere?: string;
  nasaUrl?: string;
  wikipediaUrl?: string;
}

export interface HierarchyNode {
  id: BodyId;
  children: HierarchyNode[];
}

import type { VisualConfig } from './visual';

export interface StarSystemMeta {
  id: string;
  name: string;
  description: string;
  starColor: string;
  displayOrder?: number;
  distanceFromEarth?: number;
}

export interface StarSystem {
  id: string;
  meta: StarSystemMeta;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
}
