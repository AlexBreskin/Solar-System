import type { CelestialBody, HierarchyNode, VisualConfig } from '../types';
import rawData from './celestialBodies.json';

export const CELESTIAL_BODIES = rawData.bodies as Record<string, CelestialBody>;
export const BODY_HIERARCHY = rawData.hierarchy as HierarchyNode[];
export const VISUAL_CONFIG = rawData.visualConfig as VisualConfig;
