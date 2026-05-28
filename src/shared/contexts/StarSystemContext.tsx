import { createContext, useContext } from "react";
import {
  CELESTIAL_BODIES,
  BODY_HIERARCHY,
  VISUAL_CONFIG,
} from "@/data/celestialBodies";
import type { CelestialBody, HierarchyNode, StarSystemMeta } from "@/types";
import type { VisualConfig } from "@/types/visual";

export interface StarSystemData {
  id: string;
  meta: StarSystemMeta;
  bodies: Record<string, CelestialBody>;
  hierarchy: HierarchyNode[];
  visualConfig: VisualConfig;
}

const defaultMeta: StarSystemMeta = {
  id: "sol",
  name: "Solar System",
  description:
    "Our home system — 8 planets, 5 dwarf planets, and two asteroid belts orbiting the Sun.",
  starColor: "#FDB813",
  displayOrder: 0,
};

const defaultData: StarSystemData = {
  id: "sol",
  meta: defaultMeta,
  bodies: CELESTIAL_BODIES,
  hierarchy: BODY_HIERARCHY,
  visualConfig: VISUAL_CONFIG,
};

export const StarSystemContext = createContext<StarSystemData>(defaultData);

export function useStarSystem(): StarSystemData {
  return useContext(StarSystemContext);
}
