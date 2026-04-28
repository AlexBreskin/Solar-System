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

export const EXTRAGALACTIC_IDS = new Set<string>(['m87', '3c273', 'ton618']);
