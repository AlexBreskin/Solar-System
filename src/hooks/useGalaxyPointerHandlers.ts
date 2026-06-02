import { useCallback, useState } from "react";
import type React from "react";
import type { RefObject } from "react";
import type {
  GalaxySimulation,
  GalaxyMarker,
} from "@/simulation/galaxySimulation";

export const GALAXY_SCALE = 0.01;
export const INITIAL_ZOOM = 0.8;
export const INITIAL_PAN_Y = (26000 / 2) * GALAXY_SCALE * INITIAL_ZOOM;

export interface PanState {
  panX: number;
  panY: number;
  targetPanX: number;
  targetPanY: number;
  zoom: number;
  targetZoom: number;
}

export interface DragState {
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

export interface ClusterMenu {
  x: number;
  y: number;
  systems: GalaxyMarker[];
}

export function makePanState(): PanState {
  return {
    panX: 0,
    panY: INITIAL_PAN_Y,
    targetPanX: 0,
    targetPanY: INITIAL_PAN_Y,
    zoom: INITIAL_ZOOM,
    targetZoom: INITIAL_ZOOM,
  };
}

export function makeDragState(): DragState {
  return {
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
  };
}

interface UseGalaxyPointerHandlersProps {
  topCanvasRef: RefObject<HTMLCanvasElement | null>;
  sizeRef: { current: { w: number; h: number } };
  panRef: { current: PanState };
  dragRef: { current: DragState };
  pointersRef: { current: Map<number, { x: number; y: number }> };
  hoveredRegionRef: { current: string | null };
  showRegionsRef: RefObject<boolean>;
  sim: GalaxySimulation;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onSelectRegion: (id: string | null) => void;
}

export function useGalaxyPointerHandlers({
  topCanvasRef,
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
}: UseGalaxyPointerHandlersProps) {
  const [clusterMenu, setClusterMenu] = useState<ClusterMenu | null>(null);

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
      return sim.hitTest(worldX, worldY, 24 / scale);
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
    const { pinchCenterX: mx, pinchCenterY: my } = drag;
    const ratio = newZoom / drag.pinchStartZoom;
    panRef.current.targetPanX =
      mx - ratio * (mx - (cx + drag.pinchStartPanX)) - cx;
    panRef.current.targetPanY =
      my - ratio * (my - (cy + drag.pinchStartPanY)) - cy;
    panRef.current.targetZoom = newZoom;
  }, []);

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
        const nearby = sim.getSystemsNear(worldX, worldY, 24 / scale);
        if (nearby.length >= 2) {
          setClusterMenu({ x, y, systems: nearby });
        } else {
          onSelectSystem(hit);
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

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType !== "mouse") return;
      sim.setHovered(null);
      onHoverSystem(null);
      hoveredRegionRef.current = null;
    },
    [sim, onHoverSystem],
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

  return {
    clusterMenu,
    setClusterMenu,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleWheel,
  };
}
