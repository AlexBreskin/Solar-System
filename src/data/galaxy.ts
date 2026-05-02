import rawData from './galaxy.json';
import type { GalaxyData } from '../types';

export const GALAXY_DATA: GalaxyData = rawData;

// Derived from galaxy.json — any STAR_SYSTEMS entry absent from this set is extragalactic.
export const GALACTIC_IDS = new Set(GALAXY_DATA.systems.map(s => s.id));
