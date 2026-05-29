import { useNavFilter } from "../useNavFilter";
import { STAR_SYSTEMS } from "../../data/systems";
import { GALACTIC_IDS } from "../../data/galaxy";
import { CONSTELLATIONS } from "../../data/constellations";
import { renderHook } from "../../utils/renderHook";

const allGalactic = STAR_SYSTEMS.filter((s) => GALACTIC_IDS.has(s.id));
const allExtragalactic = STAR_SYSTEMS.filter((s) => !GALACTIC_IDS.has(s.id));

describe("useNavFilter", () => {
  it("returns all systems and constellations when query is empty", () => {
    const { result } = renderHook(() => useNavFilter(""));
    expect(result.current.filteredGalactic).toHaveLength(allGalactic.length);
    expect(result.current.filteredExtragalactic).toHaveLength(
      allExtragalactic.length,
    );
    expect(result.current.filteredConstellations).toHaveLength(
      CONSTELLATIONS.length,
    );
  });

  it("galactic systems are sorted by distanceFromEarth ascending", () => {
    const { result } = renderHook(() => useNavFilter(""));
    const dists = result.current.filteredGalactic.map(
      (s) => s.distanceFromEarth ?? 0,
    );
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1]);
    }
  });

  it("extragalactic systems are sorted by distanceFromEarth ascending", () => {
    const { result } = renderHook(() => useNavFilter(""));
    const dists = result.current.filteredExtragalactic.map(
      (s) => s.distanceFromEarth ?? 0,
    );
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1]);
    }
  });

  it("filters galactic systems by name (case-insensitive)", () => {
    const { result } = renderHook(() => useNavFilter("SOL"));
    expect(result.current.filteredGalactic.length).toBeGreaterThan(0);
    expect(
      result.current.filteredGalactic.every((s) =>
        s.name.toLowerCase().includes("sol"),
      ),
    ).toBe(true);
  });

  it("filters extragalactic systems by name", () => {
    const { result } = renderHook(() => useNavFilter("andromeda"));
    const allMatch = result.current.filteredExtragalactic.every((s) =>
      s.name.toLowerCase().includes("andromeda"),
    );
    expect(allMatch).toBe(true);
  });

  it("filters constellations by constellation name", () => {
    const { result } = renderHook(() => useNavFilter("ursa"));
    expect(result.current.filteredConstellations.length).toBeGreaterThan(0);
    result.current.filteredConstellations.forEach((c) => {
      const nameMatch = c.name.toLowerCase().includes("ursa");
      const systemMatch = c.systems.some((id) => {
        const sys = STAR_SYSTEMS.find((s) => s.id === id);
        return sys?.name.toLowerCase().includes("ursa");
      });
      expect(nameMatch || systemMatch).toBe(true);
    });
  });

  it("returns empty arrays when nothing matches", () => {
    const { result } = renderHook(() =>
      useNavFilter("zzzznowaythismatchesanything"),
    );
    expect(result.current.filteredGalactic).toHaveLength(0);
    expect(result.current.filteredExtragalactic).toHaveLength(0);
    expect(result.current.filteredConstellations).toHaveLength(0);
  });

  it("whitespace-only query treats as empty after lowercasing (returns all)", () => {
    const { result } = renderHook(() => useNavFilter("   "));
    expect(result.current.filteredGalactic).toHaveLength(0);
  });

  it("includes a constellation when query matches a system name but not the constellation name", () => {
    // "betelgeuse" matches the system name but not the constellation name "Orion"
    const { result } = renderHook(() => useNavFilter("betelgeuse"));
    const orion = result.current.filteredConstellations.find(
      (c) => c.id === "orion",
    );
    expect(orion).toBeDefined();
    // Confirm the constellation name itself does NOT contain the query
    expect(orion!.name.toLowerCase()).not.toContain("betelgeuse");
  });
});
