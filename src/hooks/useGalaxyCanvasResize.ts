import { useEffect } from "react";
import type { RefObject } from "react";

export function useGalaxyCanvasResize(
  containerRef: RefObject<HTMLDivElement | null>,
  bgCanvasRef: RefObject<HTMLCanvasElement | null>,
  topCanvasRef: RefObject<HTMLCanvasElement | null>,
  sizeRef: { current: { w: number; h: number } | null },
  lastBgRef: { current: { w: number } | null },
): void {
  useEffect(() => {
    const container = containerRef.current!;
    const bgCanvas = bgCanvasRef.current!;
    const topCanvas = topCanvasRef.current!;
    const dpr = window.devicePixelRatio;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        bgCanvas.width = Math.round(width * dpr);
        bgCanvas.height = Math.round(height * dpr);
        bgCanvas.style.width = `${width}px`;
        bgCanvas.style.height = `${height}px`;
        topCanvas.width = Math.round(width * dpr);
        topCanvas.height = Math.round(height * dpr);
        topCanvas.style.width = `${width}px`;
        topCanvas.style.height = `${height}px`;
        sizeRef.current = { w: width, h: height };
        if (lastBgRef.current) lastBgRef.current.w = 0;
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);
}
