import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import { GalaxySimulation } from "@/simulation/galaxySimulation";
import type { GalaxyMarker } from "@/simulation/galaxySimulation";
import {
  drawGalaxyBackground,
  drawSystemMarkers,
  drawRegionLabels,
} from "@/renderers/galaxy-view";
import { STAR_SYSTEMS } from "@/data/systems";
import { GALAXY_DATA, GALAXY_REGIONS } from "@/data/galaxy";
import { useZoomControls } from "@/shared/hooks/useZoomControls";
import ZoomControls from "@/shared/components/ZoomControls";
import "./GalaxyCanvas.css";

export interface GalaxyCanvasHandle {
  zoomToSystem: (id: string) => void;
}

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
  constellationSystemIds?: Set<string>;
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
  pinching: boolean;
  pinchStartDist: number;
  pinchStartZoom: number;
  pinchStartPanX: number;
  pinchStartPanY: number;
  pinchCenterX: number;
  pinchCenterY: number;
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

const GalaxyCanvas = forwardRef<GalaxyCanvasHandle, GalaxyCanvasProps>(
  function GalaxyCanvas(
    {
      selectedSystem,
      hoveredSystem,
      selectedRegion,
      onSelectSystem,
      onHoverSystem,
      onSelectRegion,
      constellationSystemIds,
    }: GalaxyCanvasProps,
    ref,
  ) {
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
    const constellationSystemIdsRef = useRef(constellationSystemIds);

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
      pinching: false,
      pinchStartDist: 0,
      pinchStartZoom: 1,
      pinchStartPanX: 0,
      pinchStartPanY: 0,
      pinchCenterX: 0,
      pinchCenterY: 0,
    });
    const pointersRef = useRef<Map<number, { x: number; y: number }>>(
      new Map(),
    );

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
      constellationSystemIdsRef.current = constellationSystemIds;
    }, [constellationSystemIds]);

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
          constellationSystemIdsRef.current,
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

    const applyPinch = useCallback(() => {
      const drag = dragRef.current;
      const pointers = Array.from(pointersRef.current.values());
      if (pointers.length < 2 || drag.pinchStartDist <= 0) return;
      const [p1, p2] = pointers;
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const newZoom = Math.max(
        0.1,
        Math.min(100, drag.pinchStartZoom * (dist / drag.pinchStartDist)),
      );
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const mx = drag.pinchCenterX;
      const my = drag.pinchCenterY;
      const ratio = newZoom / drag.pinchStartZoom;
      panRef.current.targetPanX =
        mx - ratio * (mx - (cx + drag.pinchStartPanX)) - cx;
      panRef.current.targetPanY =
        my - ratio * (my - (cy + drag.pinchStartPanY)) - cy;
      panRef.current.targetZoom = newZoom;
    }, []);

    const handlePointerDown = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const canvas = topCanvasRef.current!;
        canvas.setPointerCapture(e.pointerId);
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        pointersRef.current.set(e.pointerId, { x, y });
        const drag = dragRef.current;

        if (pointersRef.current.size === 1) {
          drag.dragging = true;
          drag.dragBrokeFree = false;
          drag.pinching = false;
          drag.dragStartX = x;
          drag.dragStartY = y;
          drag.dragStartPanX = panRef.current.targetPanX;
          drag.dragStartPanY = panRef.current.targetPanY;
          canvas.style.cursor = "grabbing";
          setClusterMenu(null);
        } else if (pointersRef.current.size === 2) {
          const [p1, p2] = Array.from(pointersRef.current.values());
          drag.pinching = true;
          drag.dragging = false;
          drag.dragBrokeFree = true;
          drag.pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          drag.pinchStartZoom = panRef.current.targetZoom;
          drag.pinchStartPanX = panRef.current.targetPanX;
          drag.pinchStartPanY = panRef.current.targetPanY;
          drag.pinchCenterX = (p1.x + p2.x) / 2;
          drag.pinchCenterY = (p1.y + p2.y) / 2;
          setClusterMenu(null);
        }
      },
      [],
    );

    const updateHover = useCallback(
      (x: number, y: number) => {
        const canvas = topCanvasRef.current!;
        const hit = hitTest(x, y);
        sim.setHovered(hit);
        onHoverSystem(hit);
        if (hit) {
          hoveredRegionRef.current = null;
          canvas.style.cursor = "pointer";
          return;
        }
        const region = showRegionsRef.current ? hitTestRegion(x, y) : null;
        hoveredRegionRef.current = region?.id ?? null;
        canvas.style.cursor = region ? "pointer" : "grab";
      },
      [hitTest, hitTestRegion, sim, onHoverSystem],
    );

    const updateDrag = useCallback((x: number, y: number) => {
      const drag = dragRef.current;
      const dx = x - drag.dragStartX;
      const dy = y - drag.dragStartY;
      if (!drag.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        drag.dragBrokeFree = true;
        setClusterMenu(null);
      }
      panRef.current.targetPanX = drag.dragStartPanX + dx;
      panRef.current.targetPanY = drag.dragStartPanY + dy;
    }, []);

    const handlePointerMove = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = topCanvasRef.current!;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (pointersRef.current.has(e.pointerId)) {
          pointersRef.current.set(e.pointerId, { x, y });
        }
        const drag = dragRef.current;

        if (drag.pinching && pointersRef.current.size >= 2) {
          applyPinch();
        } else if (drag.dragging) {
          updateDrag(x, y);
        } else if (e.pointerType === "mouse") {
          updateHover(x, y);
        }
      },
      [applyPinch, updateDrag, updateHover],
    );

    const endGesture = useCallback(() => {
      const drag = dragRef.current;
      if (pointersRef.current.size < 2) drag.pinching = false;
      if (pointersRef.current.size === 0) {
        drag.dragging = false;
        drag.dragBrokeFree = false;
        topCanvasRef.current!.style.cursor = "grab";
      }
    }, []);

    const handleTap = useCallback(
      (x: number, y: number) => {
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

    const handlePointerUp = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = topCanvasRef.current!;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        pointersRef.current.delete(e.pointerId);
        const drag = dragRef.current;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const wasPinching = drag.pinching;
        const wasTap =
          drag.dragging &&
          Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) < 5;

        endGesture();
        if (!wasPinching && wasTap) handleTap(x, y);
      },
      [endGesture, handleTap],
    );

    const handleWheel = useCallback(
      (e: React.WheelEvent<HTMLCanvasElement>) => {
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
      },
      [],
    );

    const handlePointerLeave = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (e.pointerType !== "mouse") return;
        sim.setHovered(null);
        onHoverSystem(null);
        hoveredRegionRef.current = null;
      },
      [sim, onHoverSystem],
    );

    const handlePointerCancel = useCallback(
      (e: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = topCanvasRef.current!;
        try {
          canvas.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }
        pointersRef.current.delete(e.pointerId);
        endGesture();
      },
      [endGesture],
    );

    const { handleZoomIn, handleZoomOut } = useZoomControls(panRef, 0.1, 100);

    useImperativeHandle(
      ref,
      () => ({
        zoomToSystem(id: string) {
          const marker = sim.markers.find((m) => m.id === id);
          if (!marker) return;
          const targetZoom = Math.max(panRef.current.targetZoom, 5);
          const scale = GALAXY_SCALE * targetZoom;
          panRef.current.targetPanX = -marker.worldX * scale;
          panRef.current.targetPanY = -marker.worldY * scale;
          panRef.current.targetZoom = targetZoom;
        },
      }),
      [sim],
    );

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
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          onPointerLeave={handlePointerLeave}
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
          Scroll or pinch to zoom · Drag to pan · Tap to select
        </div>
      </div>
    );
  },
);

export default GalaxyCanvas;
