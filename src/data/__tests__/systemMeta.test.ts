import {
  ROOT_TYPE_ICONS,
  ROOT_TYPE_LABELS,
  ROOT_TYPE_BY_ID,
} from "../systemMeta";
import { STAR_SYSTEMS } from "../systems";
import { GALAXY_DATA } from "../galaxy";

describe("ROOT_TYPE_ICONS", () => {
  it("has an icon for every expected root type", () => {
    expect(ROOT_TYPE_ICONS["star"]).toBe("☀");
    expect(ROOT_TYPE_ICONS["black-hole"]).toBe("◉");
    expect(ROOT_TYPE_ICONS["neutron-star"]).toBe("✶");
    expect(ROOT_TYPE_ICONS["quasar"]).toBe("✵");
    expect(ROOT_TYPE_ICONS["galaxy"]).toBe("🌀");
    expect(ROOT_TYPE_ICONS["globular-cluster"]).toBe("✦");
    expect(ROOT_TYPE_ICONS["stellar-cluster"]).toBe("✺");
  });

  it("returns undefined for an unknown type", () => {
    expect(ROOT_TYPE_ICONS["unknown-type"]).toBeUndefined();
  });
});

describe("ROOT_TYPE_LABELS", () => {
  it("has a label for every expected root type", () => {
    expect(ROOT_TYPE_LABELS["star"]).toBe("Star System");
    expect(ROOT_TYPE_LABELS["black-hole"]).toBe("Black Hole");
    expect(ROOT_TYPE_LABELS["neutron-star"]).toBe("Neutron Star");
    expect(ROOT_TYPE_LABELS["quasar"]).toBe("Quasar");
    expect(ROOT_TYPE_LABELS["galaxy"]).toBe("Galaxy");
    expect(ROOT_TYPE_LABELS["globular-cluster"]).toBe("Globular Cluster");
    expect(ROOT_TYPE_LABELS["stellar-cluster"]).toBe("Stellar Cluster");
  });
});

describe("ROOT_TYPE_BY_ID", () => {
  it("contains a root type for every star system", () => {
    for (const s of STAR_SYSTEMS) {
      expect(ROOT_TYPE_BY_ID[s.id]).toBeDefined();
    }
  });

  it("GALAXY_DATA rootType takes precedence over STAR_SYSTEMS rootType", () => {
    const galaxyEntry = GALAXY_DATA.systems.find((e) =>
      STAR_SYSTEMS.some((s) => s.id === e.id),
    );
    if (galaxyEntry) {
      expect(ROOT_TYPE_BY_ID[galaxyEntry.id]).toBe(galaxyEntry.rootType);
    }
  });

  it("falls back to 'star' when STAR_SYSTEMS entry has no rootType and is not in GALAXY_DATA", () => {
    const galaxyIds = new Set(GALAXY_DATA.systems.map((e) => e.id));
    const solOnlySys = STAR_SYSTEMS.find(
      (s) => !galaxyIds.has(s.id) && !s.rootType,
    );
    if (solOnlySys) {
      expect(ROOT_TYPE_BY_ID[solOnlySys.id]).toBe("star");
    }
  });

  it("uses STAR_SYSTEMS rootType when the system is not in GALAXY_DATA", () => {
    const galaxyIds = new Set(GALAXY_DATA.systems.map((e) => e.id));
    const externalSys = STAR_SYSTEMS.find(
      (s) => !galaxyIds.has(s.id) && s.rootType,
    );
    if (externalSys) {
      expect(ROOT_TYPE_BY_ID[externalSys.id]).toBe(externalSys.rootType);
    }
  });

  it("only contains string values", () => {
    for (const val of Object.values(ROOT_TYPE_BY_ID)) {
      expect(typeof val).toBe("string");
    }
  });
});
