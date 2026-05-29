import React, { act, createRef } from "react";
import { useZoomControls } from "../useZoomControls";
import { renderHook } from "../../../utils/renderHook";

describe("useZoomControls", () => {
  function makeRef(initialZoom: number) {
    const ref = createRef() as React.MutableRefObject<{ targetZoom: number }>;
    (ref as { current: { targetZoom: number } }).current = {
      targetZoom: initialZoom,
    };
    return ref;
  }

  it("zoomIn multiplies targetZoom by the default step (1.3)", () => {
    const panRef = makeRef(1);
    const { result } = renderHook(() => useZoomControls(panRef, 0.3, 8));
    act(() => result.current.handleZoomIn());
    expect(panRef.current.targetZoom).toBeCloseTo(1.3);
  });

  it("zoomOut divides targetZoom by the default step (1.3)", () => {
    const panRef = makeRef(1.3);
    const { result } = renderHook(() => useZoomControls(panRef, 0.3, 8));
    act(() => result.current.handleZoomOut());
    expect(panRef.current.targetZoom).toBeCloseTo(1);
  });

  it("zoomIn does not exceed max", () => {
    const panRef = makeRef(7);
    const { result } = renderHook(() => useZoomControls(panRef, 0.3, 8));
    act(() => result.current.handleZoomIn());
    expect(panRef.current.targetZoom).toBe(8);
  });

  it("zoomOut does not go below min", () => {
    const panRef = makeRef(0.32);
    const { result } = renderHook(() => useZoomControls(panRef, 0.3, 8));
    act(() => result.current.handleZoomOut());
    expect(panRef.current.targetZoom).toBe(0.3);
  });

  it("respects a custom step value", () => {
    const panRef = makeRef(1);
    const { result } = renderHook(() => useZoomControls(panRef, 0.1, 100, 2));
    act(() => result.current.handleZoomIn());
    expect(panRef.current.targetZoom).toBeCloseTo(2);
    act(() => result.current.handleZoomOut());
    expect(panRef.current.targetZoom).toBeCloseTo(1);
  });

  it("galaxy bounds: zoomIn clamps at 100", () => {
    const panRef = makeRef(90);
    const { result } = renderHook(() => useZoomControls(panRef, 0.1, 100));
    act(() => result.current.handleZoomIn());
    expect(panRef.current.targetZoom).toBe(100);
  });

  it("galaxy bounds: zoomOut clamps at 0.1", () => {
    const panRef = makeRef(0.11);
    const { result } = renderHook(() => useZoomControls(panRef, 0.1, 100));
    act(() => result.current.handleZoomOut());
    expect(panRef.current.targetZoom).toBe(0.1);
  });
});
