import { STAR_SYSTEMS } from "@/data/systems";
import { GALACTIC_IDS } from "@/data/galaxy";
import { CONSTELLATIONS } from "@/data/constellations";
import type { Constellation, StarSystemMeta } from "@/types";

const systemNameById: Record<string, string> = {};
for (const s of STAR_SYSTEMS) systemNameById[s.id] = s.name.toLowerCase();

const byDist = (a: StarSystemMeta, b: StarSystemMeta) =>
  (a.distanceFromEarth ?? 0) - (b.distanceFromEarth ?? 0);
const galactic = STAR_SYSTEMS.filter((s) => GALACTIC_IDS.has(s.id)).sort(
  byDist,
);
const extragalactic = STAR_SYSTEMS.filter((s) => !GALACTIC_IDS.has(s.id)).sort(
  byDist,
);

export interface NavFilterResult {
  filteredGalactic: StarSystemMeta[];
  filteredExtragalactic: StarSystemMeta[];
  filteredConstellations: Constellation[];
}

export function useNavFilter(query: string): NavFilterResult {
  const q = query.toLowerCase();
  const filteredGalactic = q
    ? galactic.filter((s) => s.name.toLowerCase().includes(q))
    : galactic;
  const filteredExtragalactic = q
    ? extragalactic.filter((s) => s.name.toLowerCase().includes(q))
    : extragalactic;
  const filteredConstellations = q
    ? CONSTELLATIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.systems.some((id) => systemNameById[id]?.includes(q)),
      )
    : CONSTELLATIONS;

  return { filteredGalactic, filteredExtragalactic, filteredConstellations };
}
