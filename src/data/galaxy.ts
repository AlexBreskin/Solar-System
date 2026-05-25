import rawData from "./galaxy.json";
import type { GalaxyData, GalaxyRegion } from "../types";

export const GALAXY_DATA: GalaxyData = rawData as GalaxyData;

// Derived from galaxy.json — any STAR_SYSTEMS entry absent from this set is extragalactic.
export const GALACTIC_IDS = new Set(GALAXY_DATA.systems.map((s) => s.id));

export const GALAXY_REGIONS: GalaxyRegion[] = GALAXY_DATA.regions ?? [];
