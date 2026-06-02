import { useGalaxySyncRefs } from "../useGalaxySyncRefs";
import { renderHook } from "../../utils/renderHook";
import type { GalaxySimulation } from "@/simulation/galaxySimulation";
import type { GalaxyRegion } from "@/types/galaxy";

function makeSim(): GalaxySimulation {
  return {
    setHovered: vi.fn(),
    markers: [],
    regions: [],
    hoveredId: null,
    selectedId: null,
  } as unknown as GalaxySimulation;
}

describe("useGalaxySyncRefs", () => {
  it("sets selectedSystemRef.current to selectedSystem on mount", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: null,
        selectedSystem: "sol",
        selectedSystemRef,
        selectedRegion: null,
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: undefined,
        constellationSystemIdsRef,
      }),
    );

    expect(selectedSystemRef.current).toBe("sol");
  });

  it("calls sim.setHovered with hoveredSystem on mount (non-null)", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: "alpha-centauri",
        selectedSystem: null,
        selectedSystemRef,
        selectedRegion: null,
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: undefined,
        constellationSystemIdsRef,
      }),
    );

    expect(sim.setHovered).toHaveBeenCalledWith("alpha-centauri");
  });

  it("calls sim.setHovered with null when hoveredSystem is null", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: null,
        selectedSystem: null,
        selectedSystemRef,
        selectedRegion: null,
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: undefined,
        constellationSystemIdsRef,
      }),
    );

    expect(sim.setHovered).toHaveBeenCalledWith(null);
  });

  it("sets constellationSystemIdsRef.current to the provided Set on mount", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };
    const ids = new Set(["sol", "rigel", "betelgeuse"]);

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: null,
        selectedSystem: null,
        selectedSystemRef,
        selectedRegion: null,
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: ids,
        constellationSystemIdsRef,
      }),
    );

    expect(constellationSystemIdsRef.current).toBe(ids);
  });

  it("sets selectedRegionRef.current to selectedRegion on mount", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: null,
        selectedSystem: null,
        selectedSystemRef,
        selectedRegion: "orion-spur",
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: undefined,
        constellationSystemIdsRef,
      }),
    );

    expect(selectedRegionRef.current).toBe("orion-spur");
  });

  it("sets selectedRegionObjRef.current to null when selectedRegion is null", () => {
    const sim = makeSim();
    const selectedSystemRef = { current: null as string | null };
    const selectedRegionRef = { current: null as string | null };
    const selectedRegionObjRef = { current: null as GalaxyRegion | null };
    const constellationSystemIdsRef = {
      current: undefined as Set<string> | undefined,
    };

    renderHook(() =>
      useGalaxySyncRefs({
        sim,
        hoveredSystem: null,
        selectedSystem: null,
        selectedSystemRef,
        selectedRegion: null,
        selectedRegionRef,
        selectedRegionObjRef,
        constellationSystemIds: undefined,
        constellationSystemIdsRef,
      }),
    );

    expect(selectedRegionObjRef.current).toBeNull();
  });
});
