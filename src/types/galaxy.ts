export type GalacticArmHint =
  | 'orion'
  | 'sagittarius'
  | 'scutum'
  | 'norma'
  | 'perseus'
  | 'outer'
  | 'core'
  | 'halo';

export interface GalacticSystemEntry {
  id: string;
  galacticX: number;
  galacticY: number;
  galacticArmHint?: GalacticArmHint;
  distanceFromCentreKly: number;
  rootType: string;
}

export interface GalaxyData {
  systems: GalacticSystemEntry[];
}

