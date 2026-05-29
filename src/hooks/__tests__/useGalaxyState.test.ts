import { act } from "react";
import { useGalaxyState } from "../useGalaxyState";
import { CONSTELLATIONS } from "../../data/constellations";
import { renderHook } from "../../utils/renderHook";

describe("useGalaxyState", () => {
  it("initialises with the given system selected and everything else null", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    expect(result.current.selectedSystem).toBe("sol");
    expect(result.current.hoveredSystem).toBeNull();
    expect(result.current.selectedRegion).toBeNull();
    expect(result.current.selectedConstellation).toBeNull();
    expect(result.current.constellationSystemIds.size).toBe(0);
  });

  it("selectSystem updates selectedSystem and clears region and constellation", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectRegion("orion-spur"));
    act(() => result.current.selectConstellation("orion"));
    act(() => result.current.selectSystem("alpha-centauri"));
    expect(result.current.selectedSystem).toBe("alpha-centauri");
    expect(result.current.selectedRegion).toBeNull();
    expect(result.current.selectedConstellation).toBeNull();
  });

  it("hoverSystem updates hoveredSystem", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.hoverSystem("rigel"));
    expect(result.current.hoveredSystem).toBe("rigel");
    act(() => result.current.hoverSystem(null));
    expect(result.current.hoveredSystem).toBeNull();
  });

  it("selectRegion updates selectedRegion and clears selectedSystem", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectRegion("orion-spur"));
    expect(result.current.selectedRegion).toBe("orion-spur");
    expect(result.current.selectedSystem).toBeNull();
  });

  it("selectRegion with null clears the region", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectRegion("orion-spur"));
    act(() => result.current.selectRegion(null));
    expect(result.current.selectedRegion).toBeNull();
  });

  it("selectConstellation updates selectedConstellation and clears system and region", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectSystem("betelgeuse"));
    act(() => result.current.selectRegion("orion-spur"));
    act(() => result.current.selectConstellation("orion"));
    expect(result.current.selectedConstellation).toBe("orion");
    expect(result.current.selectedSystem).toBeNull();
    expect(result.current.selectedRegion).toBeNull();
  });

  it("selectConstellation with null clears the constellation", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectConstellation("orion"));
    act(() => result.current.selectConstellation(null));
    expect(result.current.selectedConstellation).toBeNull();
    expect(result.current.constellationSystemIds.size).toBe(0);
  });

  it("constellationSystemIds is empty when no constellation is selected", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    expect(result.current.constellationSystemIds.size).toBe(0);
  });

  it("constellationSystemIds returns the system set for a known constellation", () => {
    const orion = CONSTELLATIONS.find((c) => c.id === "orion");
    if (!orion) return;
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectConstellation("orion"));
    expect(result.current.constellationSystemIds.size).toBe(
      orion.systems.length,
    );
    for (const id of orion.systems) {
      expect(result.current.constellationSystemIds.has(id)).toBe(true);
    }
  });

  it("constellationSystemIds returns empty set for an unknown constellation id", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectConstellation("no-such-constellation"));
    expect(result.current.constellationSystemIds.size).toBe(0);
  });

  it("zoomToSystem updates selectedSystem and clears region and constellation without crashing when canvasRef is null", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    act(() => result.current.selectRegion("bubble"));
    act(() => result.current.selectConstellation("orion"));
    act(() => result.current.zoomToSystem("deneb"));
    expect(result.current.selectedSystem).toBe("deneb");
    expect(result.current.selectedRegion).toBeNull();
    expect(result.current.selectedConstellation).toBeNull();
  });

  it("canvasRef is initialised to null", () => {
    const { result } = renderHook(() => useGalaxyState("sol"));
    expect(result.current.canvasRef.current).toBeNull();
  });
});
