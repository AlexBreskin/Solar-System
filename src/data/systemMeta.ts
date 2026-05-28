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

// GALAXY_DATA rootType takes precedence; STAR_SYSTEMS fills any gaps.
const _map: Record<string, string> = {};
for (const entry of GALAXY_DATA.systems) _map[entry.id] = entry.rootType;
for (const s of STAR_SYSTEMS) {
  if (!_map[s.id]) _map[s.id] = s.rootType ?? "star";
}
export const ROOT_TYPE_BY_ID: Readonly<Record<string, string>> = _map;
