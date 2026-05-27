import rawData from "./constellations.json";
import type { Constellation } from "../types";

const data = rawData as { constellations: Constellation[] };
export const CONSTELLATIONS: Constellation[] = data.constellations;

export const CONSTELLATION_BY_SYSTEM: Record<string, string> = {};
for (const c of CONSTELLATIONS) {
  for (const id of c.systems) {
    CONSTELLATION_BY_SYSTEM[id] = c.id;
  }
}
