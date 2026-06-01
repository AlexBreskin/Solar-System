import { STAR_SYSTEMS } from "@/data/systems";
import { GALAXY_DATA } from "@/data/galaxy";

export const ROOT_TYPE_ICONS: Record<string, string> = {
  star: "☀",
  "black-hole": "◉",
  "neutron-star": "✶",
  quasar: "✵",
  galaxy: "🌀",
  "globular-cluster": "✦",
  "stellar-cluster": "✺",
};

export const ROOT_TYPE_LABELS: Record<string, string> = {
  star: "Star System",
  "black-hole": "Black Hole",
  "neutron-star": "Neutron Star",
  quasar: "Quasar",
  galaxy: "Galaxy",
  "globular-cluster": "Globular Cluster",
  "stellar-cluster": "Stellar Cluster",
};

/** Pure builder — separated so it can be unit-tested with synthetic data. */
export function buildRootTypeById(
  galaxyEntries: readonly { id: string; rootType: string }[],
  systems: readonly { id: string; rootType?: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  // GALAXY_DATA rootType takes precedence; STAR_SYSTEMS fills any gaps.
  for (const entry of galaxyEntries) map[entry.id] = entry.rootType;
  for (const s of systems) {
    if (!map[s.id]) map[s.id] = s.rootType ?? "star";
  }
  return map;
}

export const ROOT_TYPE_BY_ID: Readonly<Record<string, string>> =
  buildRootTypeById(GALAXY_DATA.systems, STAR_SYSTEMS);
