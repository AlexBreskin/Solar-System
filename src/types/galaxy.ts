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

export type SpiralBandShape = {
  type: "spiralBand";
  armOffset: number;
  halfWidth: number;
  tStart: number;
  tEnd: number;
};

export type EllipseShape = {
  type: "ellipse";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angleRad: number;
};

export type RegionShape = SpiralBandShape | EllipseShape;

export interface GalaxyRegion {
  id: string;
  name: string;
  labelX: number;
  labelY: number;
  color: string;
  description: string;
  funFact: string;
  wikipediaUrl?: string;
  shape?: RegionShape;
}

export interface GalaxyData {
  systems: GalacticSystemEntry[];
  regions: GalaxyRegion[];
}

export interface ConstellationStar {
  name: string;
  ra: number;
  dec: number;
  mag?: number;
  systemId?: string;
}

export interface ConstellationOutline {
  stars: ConstellationStar[];
  lines: number[][][]; // MultiLineString: segments of [ra, dec] pairs from d3-celestial
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
