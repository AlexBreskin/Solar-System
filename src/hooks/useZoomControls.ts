import { useCallback } from "react";
import type { MutableRefObject } from "react";

interface PanState {
  targetZoom: number;
}

export function useZoomControls(
  panRef: MutableRefObject<PanState>,
  min: number,
  max: number,
  step = 1.3,
): { handleZoomIn: () => void; handleZoomOut: () => void } {
  const handleZoomIn = useCallback(() => {
    panRef.current.targetZoom = Math.min(max, panRef.current.targetZoom * step);
  }, [panRef, max, step]);

  const handleZoomOut = useCallback(() => {
    panRef.current.targetZoom = Math.max(min, panRef.current.targetZoom / step);
  }, [panRef, min, step]);

  return { handleZoomIn, handleZoomOut };
}
