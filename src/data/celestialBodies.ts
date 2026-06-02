import type {
  CelestialBody,
  HierarchyNode,
  StarSystem,
  StarSystemMeta,
} from "../types";
import type { VisualConfig } from "../types/visual";

export type RawSystemJson = {
  system?: StarSystemMeta;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
};

const systemModules = import.meta.glob("./systems/*.json", {
  eager: true,
}) as Record<string, RawSystemJson>;

const rawSolData = systemModules["./systems/sol.json"];

export const CELESTIAL_BODIES = rawSolData.bodies as Record<
  string,
  CelestialBody
>;
export const BODY_HIERARCHY = rawSolData.hierarchy as HierarchyNode[];
export const VISUAL_CONFIG = rawSolData.visualConfig as VisualConfig;

/** Pure assembly step — separated so it can be unit-tested without I/O. */
export function assembleStarSystem(id: string, raw: RawSystemJson): StarSystem {
  const meta: StarSystemMeta = raw.system ?? {
    id,
    name: id,
    description: "",
    starColor: "#ffffff",
  };
  return {
    id,
    meta,
    bodies: raw.bodies,
    hierarchy: raw.hierarchy,
    visualConfig: raw.visualConfig,
  };
}

export function loadStarSystem(id: string): StarSystem {
  const module = systemModules[`./systems/${id}.json`];
  if (!module) throw new Error(`Unknown system: ${id}`);
  return assembleStarSystem(id, module);
}
