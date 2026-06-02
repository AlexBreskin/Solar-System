import React, { act } from "react";
import ReactDOM from "react-dom/client";
import type { RefObject } from "react";
import { useGalaxyCanvasResize } from "../useGalaxyCanvasResize";
import { renderHook } from "../../utils/renderHook";

// ---------------------------------------------------------------------------
// Mock ResizeObserver
// ---------------------------------------------------------------------------

let capturedCallback: ResizeObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

class MockResizeObserver {
  constructor(cb: ResizeObserverCallback) {
    capturedCallback = cb;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", MockResizeObserver);
  mockObserve.mockClear();
  mockDisconnect.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRefs() {
  const container = document.createElement("div");
  const bgCanvas = document.createElement("canvas");
  const topCanvas = document.createElement("canvas");

  const containerRef: RefObject<HTMLDivElement | null> = { current: container };
  const bgCanvasRef: RefObject<HTMLCanvasElement | null> = {
    current: bgCanvas,
  };
  const topCanvasRef: RefObject<HTMLCanvasElement | null> = {
    current: topCanvas,
  };
  const sizeRef: { current: { w: number; h: number } | null } = {
    current: null,
  };
  const lastBgRef: { current: { w: number } | null } = { current: null };

  return {
    container,
    bgCanvas,
    topCanvas,
    containerRef,
    bgCanvasRef,
    topCanvasRef,
    sizeRef,
    lastBgRef,
  };
}

function fireResize(
  width: number,
  height: number,
  target: Element = document.createElement("div"),
) {
  const entry = {
    contentRect: { width, height },
    target,
  } as unknown as ResizeObserverEntry;
  act(() => {
    capturedCallback([entry], {} as ResizeObserver);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useGalaxyCanvasResize", () => {
  it("calls ro.observe(container) on mount", () => {
    const {
      container,
      containerRef,
      bgCanvasRef,
      topCanvasRef,
      sizeRef,
      lastBgRef,
    } = makeRefs();

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    expect(mockObserve).toHaveBeenCalledWith(container);
  });

  it("updates sizeRef.current after a resize callback fires", () => {
    const { containerRef, bgCanvasRef, topCanvasRef, sizeRef, lastBgRef } =
      makeRefs();

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    fireResize(800, 600);

    expect(sizeRef.current).toEqual({ w: 800, h: 600 });
  });

  it("sets bgCanvas dimensions after resize (devicePixelRatio = 1 in jsdom)", () => {
    const {
      containerRef,
      bgCanvas,
      bgCanvasRef,
      topCanvasRef,
      sizeRef,
      lastBgRef,
    } = makeRefs();

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    fireResize(800, 600);

    expect(bgCanvas.width).toBe(800);
    expect(bgCanvas.style.width).toBe("800px");
  });

  it("sets topCanvas dimensions after resize", () => {
    const {
      containerRef,
      bgCanvasRef,
      topCanvas,
      topCanvasRef,
      sizeRef,
      lastBgRef,
    } = makeRefs();

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    fireResize(800, 600);

    expect(topCanvas.width).toBe(800);
    expect(topCanvas.style.width).toBe("800px");
  });

  it("resets lastBgRef.current.w to 0 when lastBgRef.current is non-null", () => {
    const { containerRef, bgCanvasRef, topCanvasRef, sizeRef, lastBgRef } =
      makeRefs();
    lastBgRef.current = { w: 999 };

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    fireResize(800, 600);

    expect(lastBgRef.current.w).toBe(0);
  });

  it("does not throw when lastBgRef.current is null during resize", () => {
    const { containerRef, bgCanvasRef, topCanvasRef, sizeRef, lastBgRef } =
      makeRefs();
    lastBgRef.current = null;

    renderHook(() =>
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      ),
    );

    expect(() => fireResize(800, 600)).not.toThrow();
  });

  it("calls ro.disconnect() on unmount", () => {
    const { containerRef, bgCanvasRef, topCanvasRef, sizeRef, lastBgRef } =
      makeRefs();

    // Use a manual root so we can unmount and trigger cleanup
    const mountContainer = document.createElement("div");

    function TestComponent() {
      useGalaxyCanvasResize(
        containerRef,
        bgCanvasRef,
        topCanvasRef,
        sizeRef,
        lastBgRef,
      );
      return null;
    }

    let root!: ReturnType<typeof ReactDOM.createRoot>;
    act(() => {
      root = ReactDOM.createRoot(mountContainer);
      root.render(React.createElement(TestComponent));
    });

    expect(mockDisconnect).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });

    expect(mockDisconnect).toHaveBeenCalled();
  });
});
