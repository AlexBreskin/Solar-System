import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useZoomControls } from "@/shared/hooks/useZoomControls";
import ZoomControls from "@/shared/components/ZoomControls";
import { SolarSystemSimulation } from "@/simulation/solarSystemSimulation";
import {
  drawStarField,
  drawOrbits,
  drawBelt,
  drawBodies,
  drawBodyRings,
} from "@/renderers/system-view";
import { useStarSystem } from "@/shared/contexts/StarSystemContext";
import { BodyType, ROOT_BODY_TYPES } from "@/types";
import type { CanvasSize, SystemCanvasProps } from "@/types";

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
  userDragging: boolean;
  dragBrokeFree: boolean;
  lastTime: number | null;
  pinching: boolean;
  pinchStartDist: number;
  pinchStartZoom: number;
  pinchStartPanX: number;
  pinchStartPanY: number;
  pinchCenterX: number;
  pinchCenterY: number;
}

export default function SystemCanvas({
  selectedBody,
  hoveredBody,
  trackedBody,
  speed,
  paused,
  showOrbits,
  showLabels,
  onSelectBody,
  onHoverBody,
  onTrackBody,
}: SystemCanvasProps): JSX.Element {
  const { bodies, visualConfig } = useStarSystem();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SolarSystemSimulation | null>(null);
  if (!simRef.current) {
    simRef.current = SolarSystemSimulation.create(bodies, visualConfig);
  }
  const animRef = useRef<number | null>(null);
  const sizeRef = useRef<CanvasSize>({ w: 0, h: 0 });
  const panRef = useRef<PanState>({
    panX: 0,
    panY: 0,
    targetPanX: 0,
    targetPanY: 0,
    zoom: 1,
    targetZoom: 1,
  });
  const dragRef = useRef<DragState>({
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartPanX: 0,
    dragStartPanY: 0,
    userDragging: false,
    dragBrokeFree: false,
    lastTime: null,
    pinching: false,
    pinchStartDist: 0,
    pinchStartZoom: 1,
    pinchStartPanX: 0,
    pinchStartPanY: 0,
    pinchCenterX: 0,
    pinchCenterY: 0,
  });
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  const sim = simRef.current;
  const beltIds = useMemo(
    () => sim.bodyIds.filter((id) => bodies[id]?.type === BodyType.Belt),
    [sim.bodyIds, bodies],
  );

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        sizeRef.current = { w: width, h: height };
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const zoomToBelt = useCallback(
    (id: string) => {
      const beltCfg = visualConfig.beltConfigs[id];
      if (!beltCfg) return;
      const { w, h } = sizeRef.current;
      const halfSize = Math.min(w, h) / 2;
      if (!halfSize) return;
      panRef.current.targetZoom = Math.max(
        0.3,
        (halfSize / beltCfg.outerRadius) * 0.82,
      );
      panRef.current.targetPanX = 0;
      panRef.current.targetPanY = 0;
    },
    [visualConfig],
  );

  useEffect(() => {
    if (bodies[selectedBody]?.type === "belt") zoomToBelt(selectedBody);
  }, [selectedBody, zoomToBelt, bodies]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pan = panRef.current;
    const drag = dragRef.current;
    const dpr = window.devicePixelRatio;

    function draw(ts: number): void {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      const dt =
        drag.lastTime !== null ? Math.min((ts - drag.lastTime) / 1000, 0.1) : 0;
      drag.lastTime = ts;

      const cx = w / 2;
      const cy = h / 2;

      if (!paused) sim.advanceAngles(dt, speed);
      sim.updatePositions(cx, cy);

      if (trackedBody && !drag.userDragging) {
        const bp = sim.positions[trackedBody];
        pan.targetPanX +=
          ((cx - bp.x) * pan.targetZoom - pan.targetPanX) * 0.08;
        pan.targetPanY +=
          ((cy - bp.y) * pan.targetZoom - pan.targetPanY) * 0.08;
      }

      pan.panX += (pan.targetPanX - pan.panX) * 0.1;
      pan.panY += (pan.targetPanY - pan.panY) * 0.1;
      pan.zoom += (pan.targetZoom - pan.zoom) * 0.1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#050812";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      drawStarField(ctx);

      ctx.save();
      ctx.translate(cx + pan.panX, cy + pan.panY);
      ctx.scale(pan.zoom, pan.zoom);
      ctx.translate(-cx, -cy);

      drawOrbits(
        ctx,
        cx,
        cy,
        selectedBody,
        hoveredBody,
        showOrbits,
        bodies,
        visualConfig,
        sim.positions,
      );
      for (const beltId of beltIds) {
        drawBelt(
          ctx,
          cx,
          cy,
          beltId,
          selectedBody === beltId,
          hoveredBody === beltId,
          showLabels,
          pan.zoom,
          bodies,
          visualConfig,
        );
      }
      drawBodyRings(ctx, sim.positions, "back", bodies, visualConfig);
      drawBodies(
        ctx,
        sim.positions,
        selectedBody,
        hoveredBody,
        showLabels,
        showOrbits,
        bodies,
        visualConfig,
      );
      drawBodyRings(ctx, sim.positions, "front", bodies, visualConfig);

      ctx.restore();
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [
    selectedBody,
    hoveredBody,
    trackedBody,
    speed,
    paused,
    showOrbits,
    showLabels,
    sim,
    beltIds,
    bodies,
    visualConfig,
  ]);

  const getBodyAtPoint = useCallback(
    (canvasX: number, canvasY: number): string | null => {
      const { w, h } = sizeRef.current;
      const pan = panRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const wx = (canvasX - cx - pan.panX) / pan.zoom + cx;
      const wy = (canvasY - cy - pan.panY) / pan.zoom + cy;
      const { planetSizes } = visualConfig;
      let closest: string | null = null;
      let closestDist = Infinity;
      for (const id of sim.bodyIds) {
        if (bodies[id]?.type === BodyType.Belt) continue;
        if (!bodies[id]) continue;
        const pos = sim.positions[id];
        const r = Math.max(planetSizes[id] ?? 4, 8);
        const dist = Math.hypot(wx - pos.x, wy - pos.y);
        if (dist < r * 1.5 && dist < closestDist) {
          closest = id;
          closestDist = dist;
        }
      }
      if (!closest) {
        const distFromCenter = Math.hypot(wx - cx, wy - cy);
        for (const beltId of beltIds) {
          const cfg = visualConfig.beltConfigs[beltId];
          if (
            cfg &&
            distFromCenter >= cfg.innerRadius &&
            distFromCenter <= cfg.outerRadius
          ) {
            closest = beltId;
            break;
          }
        }
      }
      return closest;
    },
    [sim, bodies, visualConfig, beltIds],
  );

  const applyPinch = useCallback(() => {
    const drag = dragRef.current;
    const pointers = Array.from(pointersRef.current.values());
    if (pointers.length < 2 || drag.pinchStartDist <= 0) return;
    const [p1, p2] = pointers;
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const newZoom = Math.max(
      0.3,
      Math.min(8, drag.pinchStartZoom * (dist / drag.pinchStartDist)),
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
      const canvas = canvasRef.current!;
      canvas.setPointerCapture(e.pointerId);
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      pointersRef.current.set(e.pointerId, { x, y });
      const drag = dragRef.current;

      if (pointersRef.current.size === 1) {
        drag.dragging = true;
        drag.userDragging = true;
        drag.dragBrokeFree = false;
        drag.pinching = false;
        drag.dragStartX = x;
        drag.dragStartY = y;
        drag.dragStartPanX = panRef.current.targetPanX;
        drag.dragStartPanY = panRef.current.targetPanY;
        canvas.style.cursor = "grabbing";
      } else if (pointersRef.current.size === 2) {
        const [p1, p2] = Array.from(pointersRef.current.values());
        drag.pinching = true;
        drag.dragging = false;
        drag.dragBrokeFree = true;
        onTrackBody(null);
        drag.pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        drag.pinchStartZoom = panRef.current.targetZoom;
        drag.pinchStartPanX = panRef.current.targetPanX;
        drag.pinchStartPanY = panRef.current.targetPanY;
        drag.pinchCenterX = (p1.x + p2.x) / 2;
        drag.pinchCenterY = (p1.y + p2.y) / 2;
      }
    },
    [onTrackBody],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (pointersRef.current.has(e.pointerId)) {
        pointersRef.current.set(e.pointerId, { x, y });
      }
      const drag = dragRef.current;

      if (drag.pinching && pointersRef.current.size >= 2) {
        applyPinch();
        return;
      }

      if (drag.dragging) {
        const dx = x - drag.dragStartX;
        const dy = y - drag.dragStartY;
        if (!drag.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          drag.dragBrokeFree = true;
          onTrackBody(null);
        }
        panRef.current.targetPanX = drag.dragStartPanX + dx;
        panRef.current.targetPanY = drag.dragStartPanY + dy;
      } else if (e.pointerType === "mouse") {
        const hit = getBodyAtPoint(x, y);
        onHoverBody(hit);
        canvas.style.cursor = hit ? "pointer" : "grab";
      }
    },
    [applyPinch, getBodyAtPoint, onHoverBody, onTrackBody],
  );

  const endGesture = useCallback(() => {
    const drag = dragRef.current;
    if (pointersRef.current.size < 2) drag.pinching = false;
    if (pointersRef.current.size === 0) {
      drag.dragging = false;
      drag.userDragging = false;
      drag.dragBrokeFree = false;
      canvasRef.current!.style.cursor = "grab";
    }
  }, []);

  const handleTap = useCallback(
    (x: number, y: number) => {
      const hit = getBodyAtPoint(x, y);
      if (!hit) return;
      onSelectBody(hit);
      if (bodies[hit]?.type === "belt") {
        zoomToBelt(hit);
      } else if (
        panRef.current.targetZoom < 1.5 &&
        !ROOT_BODY_TYPES.has(bodies[hit]?.type as BodyType)
      ) {
        panRef.current.targetZoom = Math.min(
          2.5,
          panRef.current.targetZoom * 1.8,
        );
      }
    },
    [getBodyAtPoint, onSelectBody, zoomToBelt, bodies],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
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
      const pan = panRef.current;
      const rect = canvasRef.current!.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const newZoom = Math.max(
        0.3,
        Math.min(8, pan.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)),
      );
      const zoomRatio = newZoom / pan.targetZoom;
      if (trackedBody) {
        const bp = sim.positions[trackedBody];
        const sbx = cx + pan.targetPanX + (bp.x - cx) * pan.targetZoom;
        const sby = cy + pan.targetPanY + (bp.y - cy) * pan.targetZoom;
        pan.targetPanX = sbx - zoomRatio * (sbx - (cx + pan.targetPanX)) - cx;
        pan.targetPanY = sby - zoomRatio * (sby - (cy + pan.targetPanY)) - cy;
      } else {
        pan.targetPanX = mx - zoomRatio * (mx - (cx + pan.targetPanX)) - cx;
        pan.targetPanY = my - zoomRatio * (my - (cy + pan.targetPanY)) - cy;
      }
      pan.targetZoom = newZoom;
    },
    [trackedBody, sim],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current!.getBoundingClientRect();
      const hit = getBodyAtPoint(e.clientX - rect.left, e.clientY - rect.top);
      if (hit) onTrackBody(hit);
    },
    [getBodyAtPoint, onTrackBody],
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (e.pointerType === "mouse") onHoverBody(null);
    },
    [onHoverBody],
  );

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
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

  const { handleZoomIn, handleZoomOut } = useZoomControls(panRef, 0.3, 8);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
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
        onDoubleClick={handleDoubleClick}
      />
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
          fontFamily: "Syne, sans-serif",
          pointerEvents: "none",
          lineHeight: 1.8,
        }}
      >
        Scroll or pinch to zoom · Drag to pan · Tap to select · Double-tap to
        track
      </div>
    </div>
  );
}
