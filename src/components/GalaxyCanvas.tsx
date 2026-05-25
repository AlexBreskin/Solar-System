import React, { useRef, useEffect, useCallback, useState } from "react";
import { GalaxySimulation } from "../simulation/galaxySimulation";
import type { GalaxyMarker } from "../simulation/galaxySimulation";
import {
  drawGalaxyBackground,
  drawSystemMarkers,
  drawRegionLabels,
} from "../renderers/galaxyRenderer";
import { STAR_SYSTEMS } from "../data/systems";
import { GALAXY_DATA, GALAXY_REGIONS } from "../data/galaxy";
import { useZoomControls } from "../hooks/useZoomControls";
import ZoomControls from "./ZoomControls";
import "./GalaxyCanvas.css";

const GALAXY_SCALE = 0.01;
const GALACTIC_CENTRE_WORLD_Y = -26000;
const INITIAL_ZOOM = 0.8;
const INITIAL_PAN_Y = (26000 / 2) * GALAXY_SCALE * INITIAL_ZOOM;

interface GalaxyCanvasProps {
  selectedSystem: string | null;
  hoveredSystem: string | null;
  selectedRegion: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onSelectRegion: (id: string | null) => void;
}

interface PanState {
  panX: number;
  panY: number;
  targetPanX: number;
  targetPanY: number;
  zoom: number;
  targetZoom: number;
}

interface DragState {
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartPanX: number;
  dragStartPanY: number;
  dragBrokeFree: boolean;
}

interface ClusterMenu {
  x: number;
  y: number;
  systems: GalaxyMarker[];
}

interface LastBg {
  gcx: number;
  gcy: number;
  scale: number;
  zoom: number;
  w: number;
  h: number;
}

function rootTypeIcon(rootType: string): string {
  const icons: Record<string, string> = {
    star: "☀",
    "black-hole": "◉",
    "neutron-star": "✶",
    quasar: "✵",
  };
  return icons[rootType] ?? "☀";
}

export default function GalaxyCanvas({
  selectedSystem,
  hoveredSystem,
  selectedRegion,
  onSelectSystem,
  onHoverSystem,
  onSelectRegion,
}: GalaxyCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);

  const simRef = useRef<GalaxySimulation | null>(null);
  if (!simRef.current) {
    simRef.current = new GalaxySimulation(GALAXY_DATA, STAR_SYSTEMS);
  }
  const sim = simRef.current;

  const [clusterMenu, setClusterMenu] = useState<ClusterMenu | null>(null);
  const [showRegions, setShowRegions] = useState(false);
  const hoveredRegionRef = useRef<string | null>(null);
  const selectedSystemRef = useRef(selectedSystem);
  const selectedRegionRef = useRef(selectedRegion);
  const showRegionsRef = useRef(showRegions);

  const animRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const lastBgRef = useRef<LastBg>({
    gcx: NaN,
    gcy: NaN,
    scale: NaN,
    zoom: NaN,
    w: 0,
    h: 0,
  });
  const panRef = useRef<PanState>({
    panX: 0,
    panY: INITIAL_PAN_Y,
    targetPanX: 0,
    targetPanY: INITIAL_PAN_Y,
    zoom: INITIAL_ZOOM,
    targetZoom: INITIAL_ZOOM,
  });
  const dragRef = useRef<DragState>({
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartPanX: 0,
    dragStartPanY: 0,
    dragBrokeFree: false,
  });

  // Size both canvases whenever the container resizes
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
        // Force background redraw on next frame
        lastBgRef.current.w = 0;
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    sim.setHovered(hoveredSystem ?? null);
  }, [sim, hoveredSystem]);

  useEffect(() => {
    selectedSystemRef.current = selectedSystem;
  }, [selectedSystem]);

  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  useEffect(() => {
    const bgCanvas = bgCanvasRef.current!;
    const topCanvas = topCanvasRef.current!;
    const bgCtx = bgCanvas.getContext("2d")!;
    const topCtx = topCanvas.getContext("2d")!;
    const pan = panRef.current;
    const lastBg = lastBgRef.current;
    const dpr = window.devicePixelRatio;

    function draw(ts: number): void {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      pan.panX += (pan.targetPanX - pan.panX) * 0.1;
      pan.panY += (pan.targetPanY - pan.panY) * 0.1;
      pan.zoom += (pan.targetZoom - pan.zoom) * 0.1;

      const scale = GALAXY_SCALE * pan.zoom;
      const cx = w / 2;
      const cy = h / 2;
      const gcx = cx + pan.panX;
      const gcy = cy + pan.panY + GALACTIC_CENTRE_WORLD_Y * scale;

      // Background canvas — only repaint when the view has actually changed
      const bgChanged =
        gcx !== lastBg.gcx ||
        gcy !== lastBg.gcy ||
        scale !== lastBg.scale ||
        pan.zoom !== lastBg.zoom ||
        w !== lastBg.w ||
        h !== lastBg.h;
      if (bgChanged) {
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

      // Marker canvas — clear and redraw every frame (animated pulse, hover)
      topCtx.save();
      topCtx.scale(dpr, dpr);
      topCtx.clearRect(0, 0, w, h);
      if (showRegionsRef.current) {
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
      );
      topCtx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [sim]);

  const getWorldCoords = useCallback((canvasX: number, canvasY: number) => {
    const { w, h } = sizeRef.current;
    const pan = panRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const scale = GALAXY_SCALE * pan.zoom;
    const worldX = (canvasX - cx - pan.panX) / scale;
    const worldY = (canvasY - cy - pan.panY) / scale;
    return { worldX, worldY, scale };
  }, []);

  const hitTest = useCallback(
    (canvasX: number, canvasY: number): string | null => {
      const { worldX, worldY, scale } = getWorldCoords(canvasX, canvasY);
      const hitRadiusLy = 24 / scale;
      return sim.hitTest(worldX, worldY, hitRadiusLy);
    },
    [sim, getWorldCoords],
  );

  const hitTestRegion = useCallback(
    (canvasX: number, canvasY: number) => {
      const { worldX, worldY, scale } = getWorldCoords(canvasX, canvasY);
      return sim.hitTestRegion(worldX, worldY, 48 / scale);
    },
    [sim, getWorldCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = topCanvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const drag = dragRef.current;
      if (drag.dragging) {
        const dx = x - drag.dragStartX;
        const dy = y - drag.dragStartY;
        if (!drag.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          drag.dragBrokeFree = true;
          setClusterMenu(null);
        }
        panRef.current.targetPanX = drag.dragStartPanX + dx;
        panRef.current.targetPanY = drag.dragStartPanY + dy;
      } else {
        const hit = hitTest(x, y);
        sim.setHovered(hit);
        onHoverSystem(hit);
        if (!hit) {
          const region = showRegionsRef.current ? hitTestRegion(x, y) : null;
          hoveredRegionRef.current = region?.id ?? null;
          canvas.style.cursor = region ? "pointer" : "grab";
        } else {
          hoveredRegionRef.current = null;
          canvas.style.cursor = "pointer";
        }
      }
    },
    [hitTest, hitTestRegion, sim, onHoverSystem],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = topCanvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const drag = dragRef.current;
      drag.dragging = true;
      drag.dragBrokeFree = false;
      drag.dragStartX = e.clientX - rect.left;
      drag.dragStartY = e.clientY - rect.top;
      drag.dragStartPanX = panRef.current.targetPanX;
      drag.dragStartPanY = panRef.current.targetPanY;
      canvas.style.cursor = "grabbing";
      setClusterMenu(null);
    },
    [],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = topCanvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const drag = dragRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      drag.dragging = false;
      drag.dragBrokeFree = false;
      canvas.style.cursor = "grab";

      if (Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) >= 5)
        return;

      const hit = hitTest(x, y);
      if (hit) {
        const { worldX, worldY, scale } = getWorldCoords(x, y);
        const hitRadiusLy = 24 / scale;
        const nearby = sim.getSystemsNear(worldX, worldY, hitRadiusLy);
        if (nearby.length >= 2) {
          setClusterMenu({ x, y, systems: nearby });
        } else {
          onSelectSystem(hit);
          if (selectedRegionRef.current !== null) onSelectRegion(null);
          setClusterMenu(null);
        }
        return;
      }

      const region = showRegionsRef.current ? hitTestRegion(x, y) : null;
      if (region) {
        onSelectRegion(region.id);
        setClusterMenu(null);
      }
    },
    [
      hitTest,
      hitTestRegion,
      getWorldCoords,
      sim,
      onSelectSystem,
      onSelectRegion,
    ],
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setClusterMenu(null);
    const pan = panRef.current;
    const rect = topCanvasRef.current!.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newZoom = Math.max(
      0.1,
      Math.min(100, pan.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)),
    );
    const zoomRatio = newZoom / pan.targetZoom;
    pan.targetPanX = mx - zoomRatio * (mx - (cx + pan.targetPanX)) - cx;
    pan.targetPanY = my - zoomRatio * (my - (cy + pan.targetPanY)) - cy;
    pan.targetZoom = newZoom;
  }, []);

  const handleMouseLeave = useCallback(() => {
    sim.setHovered(null);
    onHoverSystem(null);
    hoveredRegionRef.current = null;
    dragRef.current.dragging = false;
  }, [sim, onHoverSystem]);

  const { handleZoomIn, handleZoomOut } = useZoomControls(panRef, 0.1, 100);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {/* Background layer — never cleared, only repaints on pan/zoom */}
      <canvas
        ref={bgCanvasRef}
        style={{ position: "absolute", inset: 0, display: "block" }}
      />
      {/* Marker layer — repaints every frame; receives all pointer events */}
      <canvas
        ref={topCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          cursor: "grab",
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      {clusterMenu && (
        <div
          className="galaxy-cluster-menu"
          style={{ left: clusterMenu.x, top: clusterMenu.y }}
        >
          {clusterMenu.systems.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                onSelectSystem(s.id);
                setClusterMenu(null);
              }}
            >
              <span>{rootTypeIcon(s.rootType)}</span>
              {s.name}
            </button>
          ))}
        </div>
      )}
      <button
        className={`galaxy-regions-toggle${showRegions ? " active" : ""}`}
        onClick={() => {
          const next = !showRegionsRef.current;
          showRegionsRef.current = next;
          setShowRegions(next);
        }}
        title="Toggle galactic region labels"
      >
        ✦ Regions
      </button>
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      <div className="galaxy-hint">
        Scroll to zoom · Drag to pan · Click to select
      </div>
    </div>
  );
}
