import { act } from "react";
import type { RefObject } from "react";
import {
  GALAXY_SCALE,
  INITIAL_ZOOM,
  INITIAL_PAN_Y,
  makePanState,
  makeDragState,
  useGalaxyPointerHandlers,
} from "../useGalaxyPointerHandlers";
import type { PanState, DragState } from "../useGalaxyPointerHandlers";
import type {
  GalaxySimulation,
  GalaxyMarker,
} from "../../simulation/galaxySimulation";
import { renderHook } from "../../utils/renderHook";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMockCanvas() {
  return {
    style: { cursor: "" },
    getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0 })),
    setPointerCapture: vi.fn(),
    releasePointerCapture: vi.fn(),
  };
}

function makeMockSim(): GalaxySimulation {
  return {
    markers: [] as GalaxyMarker[],
    hoveredId: null,
    selectedId: null,
    hitTest: vi.fn(() => null),
    hitTestRegion: vi.fn(() => null),
    getSystemsNear: vi.fn(() => []),
    setHovered: vi.fn(),
    regions: [],
  } as unknown as GalaxySimulation;
}

function makeProps(overrides?: { sim?: GalaxySimulation }) {
  const mockCanvas = makeMockCanvas();
  const sim = overrides?.sim ?? makeMockSim();

  const topCanvasRef: RefObject<HTMLCanvasElement | null> = {
    current: mockCanvas as unknown as HTMLCanvasElement,
  };
  const sizeRef: { current: { w: number; h: number } } = {
    current: { w: 800, h: 600 },
  };
  const panRef: { current: PanState } = { current: makePanState() };
  const dragRef: { current: DragState } = { current: makeDragState() };
  const pointersRef: { current: Map<number, { x: number; y: number }> } = {
    current: new Map(),
  };
  const hoveredRegionRef: { current: string | null } = { current: null };
  const showRegionsRef = { current: false } as unknown as RefObject<boolean>;
  const onSelectSystem = vi.fn();
  const onHoverSystem = vi.fn();
  const onSelectRegion = vi.fn();

  return {
    topCanvasRef,
    mockCanvas,
    sizeRef,
    panRef,
    dragRef,
    pointersRef,
    hoveredRegionRef,
    showRegionsRef,
    sim,
    onSelectSystem,
    onHoverSystem,
    onSelectRegion,
  };
}

// Build a minimal React pointer event object
function makePointerEvent(
  overrides: Partial<{
    pointerId: number;
    pointerType: string;
    button: number;
    clientX: number;
    clientY: number;
    deltaY: number;
    preventDefault: () => void;
  }> = {},
) {
  return {
    pointerId: 1,
    pointerType: "mouse",
    button: 0,
    clientX: 100,
    clientY: 100,
    deltaY: 0,
    preventDefault: vi.fn(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Constants and factories
// ---------------------------------------------------------------------------

describe("constants and factories", () => {
  it("GALAXY_SCALE equals 0.01", () => {
    expect(GALAXY_SCALE).toBe(0.01);
  });

  it("INITIAL_ZOOM equals 0.8", () => {
    expect(INITIAL_ZOOM).toBe(0.8);
  });

  it("INITIAL_PAN_Y equals (26000 / 2) * GALAXY_SCALE * INITIAL_ZOOM", () => {
    expect(INITIAL_PAN_Y).toBe((26000 / 2) * GALAXY_SCALE * INITIAL_ZOOM);
  });

  it("makePanState() returns correct initial PanState", () => {
    const pan = makePanState();
    expect(pan.zoom).toBe(INITIAL_ZOOM);
    expect(pan.targetZoom).toBe(INITIAL_ZOOM);
    expect(pan.panX).toBe(0);
    expect(pan.targetPanX).toBe(0);
  });

  it("makeDragState() returns correct initial DragState", () => {
    const drag = makeDragState();
    expect(drag.dragging).toBe(false);
    expect(drag.pinching).toBe(false);
    expect(drag.dragBrokeFree).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// handlePointerLeave
// ---------------------------------------------------------------------------

describe("handlePointerLeave", () => {
  it("clears hover state on mouse leave", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    await act(async () => {
      result.current.handlePointerLeave(
        makePointerEvent({ pointerType: "mouse" }) as any,
      );
    });

    expect(props.sim.setHovered).toHaveBeenCalledWith(null);
    expect(props.onHoverSystem).toHaveBeenCalledWith(null);
    expect(props.hoveredRegionRef.current).toBeNull();
  });

  it("is a no-op for non-mouse pointer (pointerType 'touch')", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    await act(async () => {
      result.current.handlePointerLeave(
        makePointerEvent({ pointerType: "touch" }) as any,
      );
    });

    expect(props.sim.setHovered).not.toHaveBeenCalled();
    expect(props.onHoverSystem).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// handleWheel
// ---------------------------------------------------------------------------

describe("handleWheel", () => {
  it("decreases targetZoom when deltaY > 0 (zoom out)", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));
    const initialZoom = props.panRef.current.targetZoom;

    await act(async () => {
      result.current.handleWheel(
        makePointerEvent({
          deltaY: 100,
          clientX: 400,
          clientY: 300,
          preventDefault: vi.fn(),
        }) as any,
      );
    });

    expect(props.panRef.current.targetZoom).toBeLessThan(initialZoom);
  });

  it("increases targetZoom when deltaY < 0 (zoom in)", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));
    const initialZoom = props.panRef.current.targetZoom;

    await act(async () => {
      result.current.handleWheel(
        makePointerEvent({
          deltaY: -100,
          clientX: 400,
          clientY: 300,
          preventDefault: vi.fn(),
        }) as any,
      );
    });

    expect(props.panRef.current.targetZoom).toBeGreaterThan(initialZoom);
  });
});

// ---------------------------------------------------------------------------
// handlePointerDown
// ---------------------------------------------------------------------------

describe("handlePointerDown", () => {
  it("sets drag.dragging = true and records dragStart coords on first pointer", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    await act(async () => {
      result.current.handlePointerDown(
        makePointerEvent({ pointerId: 1, clientX: 200, clientY: 150 }) as any,
      );
    });

    expect(props.dragRef.current.dragging).toBe(true);
    expect(props.dragRef.current.dragStartX).toBe(200);
    expect(props.dragRef.current.dragStartY).toBe(150);
  });

  it("calls canvas.setPointerCapture(pointerId)", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    await act(async () => {
      result.current.handlePointerDown(
        makePointerEvent({ pointerId: 42, clientX: 100, clientY: 100 }) as any,
      );
    });

    expect(props.mockCanvas.setPointerCapture).toHaveBeenCalledWith(42);
  });

  it("ignores right-click (button !== 0 for 'mouse' pointerType)", async () => {
    const props = makeProps();
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    await act(async () => {
      result.current.handlePointerDown(
        makePointerEvent({
          pointerType: "mouse",
          button: 2,
          clientX: 100,
          clientY: 100,
        }) as any,
      );
    });

    expect(props.dragRef.current.dragging).toBe(false);
    expect(props.mockCanvas.setPointerCapture).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tap detection (handlePointerDown + handlePointerUp)
// ---------------------------------------------------------------------------

describe("tap detection", () => {
  it("calls onSelectSystem when pointer up is at almost the same position as pointer down", async () => {
    const sim = makeMockSim();
    sim.hitTest = vi.fn(() => "sol");
    sim.getSystemsNear = vi.fn(() => [{ id: "sol" } as any]);

    const props = makeProps({ sim });
    const { result } = renderHook(() => useGalaxyPointerHandlers(props));

    // Pointer down at (100, 100)
    await act(async () => {
      result.current.handlePointerDown(
        makePointerEvent({
          pointerId: 1,
          clientX: 100,
          clientY: 100,
          button: 0,
        }) as any,
      );
    });

    // Pointer up at (101, 101) — distance < 5
    await act(async () => {
      result.current.handlePointerUp(
        makePointerEvent({
          pointerId: 1,
          clientX: 101,
          clientY: 101,
          button: 0,
        }) as any,
      );
    });

    expect(props.onSelectSystem).toHaveBeenCalledWith("sol");
  });
});
