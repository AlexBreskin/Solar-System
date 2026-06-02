import { useEffect } from "react";
import type { RefObject } from "react";
import type { GalaxySimulation } from "@/simulation/galaxySimulation";
import type { GalaxyRegion } from "@/types/galaxy";
import { GALAXY_REGIONS } from "@/data/galaxy";
import {
  drawGalaxyBackground,
  drawRegionHighlight,
  drawRegionLabels,
  drawSystemMarkers,
} from "@/renderers/galaxy-view";
import { GALACTIC_CENTRE_WORLD_Y } from "@/utils/spiralGeometry";
import { GALAXY_SCALE } from "@/hooks/useGalaxyPointerHandlers";
import type { PanState } from "@/hooks/useGalaxyPointerHandlers";

export interface LastBg {
  gcx: number;
  gcy: number;
  scale: number;
  zoom: number;
  w: number;
  h: number;
}

export function makeLastBg(): LastBg {
  return { gcx: NaN, gcy: NaN, scale: NaN, zoom: NaN, w: 0, h: 0 };
}

function bgNeedsRepaint(
  gcx: number,
  gcy: number,
  scale: number,
  zoom: number,
  w: number,
  h: number,
  last: LastBg,
): boolean {
  return (
    gcx !== last.gcx ||
    gcy !== last.gcy ||
    scale !== last.scale ||
    zoom !== last.zoom ||
    w !== last.w ||
    h !== last.h
  );
}

export interface DrawLoopRefs {
  bgCanvasRef: RefObject<HTMLCanvasElement | null>;
  topCanvasRef: RefObject<HTMLCanvasElement | null>;
  sizeRef: RefObject<{ w: number; h: number }>;
  panRef: RefObject<PanState>;
  animRef: { current: number | null };
  lastBgRef: RefObject<LastBg>;
  showRegionsRef: RefObject<boolean>;
  selectedRegionObjRef: RefObject<GalaxyRegion | null>;
  hoveredRegionRef: RefObject<string | null>;
  selectedRegionRef: RefObject<string | null>;
  selectedSystemRef: RefObject<string | null>;
  constellationSystemIdsRef: { current: Set<string> | undefined };
}

export function useGalaxyDrawLoop(
  refs: DrawLoopRefs,
  sim: GalaxySimulation,
): void {
  const {
    bgCanvasRef,
    topCanvasRef,
    sizeRef,
    panRef,
    animRef,
    lastBgRef,
    showRegionsRef,
    selectedRegionObjRef,
    hoveredRegionRef,
    selectedRegionRef,
    selectedSystemRef,
    constellationSystemIdsRef,
  } = refs;

  useEffect(() => {
    const bgCtx = bgCanvasRef.current!.getContext("2d")!;
    const topCtx = topCanvasRef.current!.getContext("2d")!;
    const pan = panRef.current!;
    const lastBg = lastBgRef.current!;
    const dpr = window.devicePixelRatio;

    function draw(ts: number): void {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current!;
      if (!w || !h) return;

      pan.panX += (pan.targetPanX - pan.panX) * 0.1;
      pan.panY += (pan.targetPanY - pan.panY) * 0.1;
      pan.zoom += (pan.targetZoom - pan.zoom) * 0.1;

      const scale = GALAXY_SCALE * pan.zoom;
      const cx = w / 2;
      const cy = h / 2;
      const gcx = cx + pan.panX;
      const gcy = cy + pan.panY + GALACTIC_CENTRE_WORLD_Y * scale;

      if (bgNeedsRepaint(gcx, gcy, scale, pan.zoom, w, h, lastBg)) {
        bgCtx.save();
        bgCtx.scale(dpr, dpr);
        drawGalaxyBackground(bgCtx, w, h, gcx, gcy, scale, pan.zoom);
        bgCtx.restore();
        lastBg.gcx = gcx;
        lastBg.gcy = gcy;
        lastBg.scale = scale;
        lastBg.zoom = pan.zoom;
        lastBg.w = w;
        lastBg.h = h;
      }

      topCtx.save();
      topCtx.scale(dpr, dpr);
      topCtx.clearRect(0, 0, w, h);
      if (showRegionsRef.current) {
        if (selectedRegionObjRef.current) {
          drawRegionHighlight(
            topCtx,
            selectedRegionObjRef.current,
            gcx,
            gcy,
            scale,
            pan.zoom,
          );
        }
        drawRegionLabels(
          topCtx,
          GALAXY_REGIONS,
          hoveredRegionRef.current,
          selectedRegionRef.current,
          cx,
          cy,
          pan.panX,
          pan.panY,
          scale,
          pan.zoom,
        );
      }
      drawSystemMarkers(
        topCtx,
        sim.markers,
        sim.hoveredId,
        selectedSystemRef.current,
        cx,
        cy,
        pan.panX,
        pan.panY,
        scale,
        ts,
        pan.zoom,
        constellationSystemIdsRef.current,
      );
      topCtx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [sim]);
}
