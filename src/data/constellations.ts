import type { Constellation } from "../types";

const modules = import.meta.glob("./constellations/*.json", {
  eager: true,
  import: "default",
}) as Record<string, Constellation>;

export const CONSTELLATIONS: Constellation[] = Object.values(modules).sort(
  (a, b) => a.name.localeCompare(b.name),
);

export const CONSTELLATION_BY_SYSTEM: Record<string, string> = {};
for (const c of CONSTELLATIONS) {
  for (const id of c.systems) {
    CONSTELLATION_BY_SYSTEM[id] = c.id;
  }
}
