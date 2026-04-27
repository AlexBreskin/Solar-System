import type { CelestialBody, HierarchyNode, StarSystem, StarSystemMeta } from '../types';
import type { VisualConfig } from '../types/visual';
import rawSolData from './systems/sol.json';

export const CELESTIAL_BODIES = rawSolData.bodies as Record<string, CelestialBody>;
export const BODY_HIERARCHY = rawSolData.hierarchy as HierarchyNode[];
export const VISUAL_CONFIG = rawSolData.visualConfig as VisualConfig;

type RawSystemJson = {
  system?: StarSystemMeta;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
};

const systemModules = import.meta.glob('./systems/*.json') as Record<
  string,
  () => Promise<{ default: RawSystemJson }>
>;

export async function loadStarSystem(id: string): Promise<StarSystem> {
  const loader = systemModules[`./systems/${id}.json`];
  if (!loader) throw new Error(`Unknown system: ${id}`);
  const { default: raw } = await loader();
  const meta: StarSystemMeta = raw.system ?? { id, name: id, description: '', starColor: '#ffffff' };
  return {
    id,
    meta,
    bodies: raw.bodies,
    hierarchy: raw.hierarchy,
    visualConfig: raw.visualConfig,
  };
}
