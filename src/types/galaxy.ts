export type GalacticArmHint =
  | "orion"
  | "sagittarius"
  | "scutum"
  | "norma"
  | "perseus"
  | "outer"
  | "core"
  | "halo";

export interface GalacticSystemEntry {
  id: string;
  galacticX: number;
  galacticY: number;
  galacticArmHint?: GalacticArmHint;
  distanceFromCentreKly: number;
  rootType: string;
}

export interface GalaxyRegion {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  color: string;
  description: string;
  funFact: string;
  wikipediaUrl?: string;
}

export interface GalaxyData {
  systems: GalacticSystemEntry[];
  regions: GalaxyRegion[];
}

export interface ConstellationStar {
  name: string;
  x: number;
  y: number;
  mag?: number;
  systemId?: string;
}

export interface ConstellationOutline {
  stars: ConstellationStar[];
  lines: number[][];
}

export interface Constellation {
  id: string;
  name: string;
  description: string;
  funFact: string;
  systems: string[];
  wikipediaUrl?: string;
  outline?: ConstellationOutline;
}
