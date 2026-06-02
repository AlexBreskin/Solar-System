import {
  useGalaxyZoomHandle,
  type GalaxyCanvasHandle,
} from "../useGalaxyZoomHandle";
import {
  makePanState,
  GALAXY_SCALE,
  type PanState,
} from "../useGalaxyPointerHandlers";
import { renderHook } from "../../utils/renderHook";
import type { GalaxySimulation } from "@/simulation/galaxySimulation";

function makeSim(
  markers: Array<{ id: string; worldX: number; worldY: number }>,
): GalaxySimulation {
  return {
    markers,
    regions: [],
    hoveredId: null,
    selectedId: null,
    setHovered: vi.fn(),
  } as unknown as GalaxySimulation;
}

describe("useGalaxyZoomHandle", () => {
  it("populates handleRef.current with a zoomToSystem function after renderHook", () => {
    const handleRef = { current: null as GalaxyCanvasHandle | null };
    const sim = makeSim([]);
    const panRef = { current: makePanState() };

    renderHook(() => useGalaxyZoomHandle(handleRef, sim, panRef));

    expect(handleRef.current).not.toBeNull();
    expect(typeof handleRef.current?.zoomToSystem).toBe("function");
  });

  it("zoomToSystem sets targetPanX, targetPanY, and targetZoom correctly for a known marker", () => {
    const handleRef = { current: null as GalaxyCanvasHandle | null };
    const sim = makeSim([{ id: "sol", worldX: 100, worldY: 200 }]);
    const panRef = { current: makePanState() };

    renderHook(() => useGalaxyZoomHandle(handleRef, sim, panRef));

    handleRef.current!.zoomToSystem("sol");

    const expectedZoom = Math.max(panRef.current.targetZoom, 5);
    const scale = GALAXY_SCALE * expectedZoom;
    expect(panRef.current.targetZoom).toBe(expectedZoom);
    expect(panRef.current.targetPanX).toBeCloseTo(-100 * scale);
    expect(panRef.current.targetPanY).toBeCloseTo(-200 * scale);
  });

  it("zoomToSystem is a no-op for an unknown id", () => {
    const handleRef = { current: null as GalaxyCanvasHandle | null };
    const sim = makeSim([{ id: "sol", worldX: 100, worldY: 200 }]);
    const panState = makePanState();
    const originalTargetPanX = panState.targetPanX;
    const originalTargetPanY = panState.targetPanY;
    const originalTargetZoom = panState.targetZoom;
    const panRef: { current: PanState } = { current: panState };

    renderHook(() => useGalaxyZoomHandle(handleRef, sim, panRef));

    handleRef.current!.zoomToSystem("unknown-system");

    expect(panRef.current.targetPanX).toBe(originalTargetPanX);
    expect(panRef.current.targetPanY).toBe(originalTargetPanY);
    expect(panRef.current.targetZoom).toBe(originalTargetZoom);
  });

  it("zoomToSystem uses at least zoom level 5 when current targetZoom is below 5", () => {
    const handleRef = { current: null as GalaxyCanvasHandle | null };
    const sim = makeSim([{ id: "sol", worldX: 50, worldY: 50 }]);
    const panRef = { current: makePanState() };
    // INITIAL_ZOOM (0.8) is well below 5, so targetZoom should be clamped to 5
    expect(panRef.current.targetZoom).toBeLessThan(5);

    renderHook(() => useGalaxyZoomHandle(handleRef, sim, panRef));

    handleRef.current!.zoomToSystem("sol");

    expect(panRef.current.targetZoom).toBe(5);
  });

  it("zoomToSystem preserves targetZoom when it is already above 5", () => {
    const handleRef = { current: null as GalaxyCanvasHandle | null };
    const sim = makeSim([{ id: "sol", worldX: 50, worldY: 50 }]);
    const panRef = { current: makePanState() };

    renderHook(() => useGalaxyZoomHandle(handleRef, sim, panRef));

    // Set zoom above 5 after render, before calling zoomToSystem
    panRef.current.targetZoom = 10;

    handleRef.current!.zoomToSystem("sol");

    expect(panRef.current.targetZoom).toBe(10);
  });
});
