export interface GalacticSystemEntry {
  id: string;
  galacticX: number;
  galacticY: number;
  galacticArmHint?: string;
  distanceFromCentreKly: number;
  rootType: string;
}

export interface GalaxyData {
  systems: GalacticSystemEntry[];
}

