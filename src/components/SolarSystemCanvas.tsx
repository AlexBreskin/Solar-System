import React, { useRef, useEffect, useCallback } from "react";
import { useZoomControls } from "../hooks/useZoomControls";
import ZoomControls from "./ZoomControls";
import { SolarSystemSimulation } from "../simulation/solarSystemSimulation";
import {
  drawStarField,
  drawOrbits,
  drawBelt,
  drawBodies,
  drawBodyRings,
} from "../renderers/solarSystemRenderer";
import { useStarSystem } from "../contexts/StarSystemContext";
import { BodyType, ROOT_BODY_TYPES } from "../types";
import type { CanvasSize, SolarSystemCanvasProps } from "../types";

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
}

export default function SolarSystemCanvas({
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
}: SolarSystemCanvasProps): JSX.Element {
  const { bodies, visualConfig } = useStarSystem();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<SolarSystemSimulation | null>(null);
  if (!simRef.current) {
    simRef.current = new SolarSystemSimulation(bodies, visualConfig);
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
  });

  const sim = simRef.current;
  const beltIds = sim.bodyIds.filter(
    (id) => bodies[id]?.type === BodyType.Belt,
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

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const drag = dragRef.current;
      if (drag.dragging) {
        const dx = x - drag.dragStartX;
        const dy = y - drag.dragStartY;
        if (!drag.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          drag.dragBrokeFree = true;
          onTrackBody(null);
        }
        panRef.current.targetPanX = drag.dragStartPanX + dx;
        panRef.current.targetPanY = drag.dragStartPanY + dy;
      } else {
        const hit = getBodyAtPoint(x, y);
        onHoverBody(hit);
        canvas.style.cursor = hit ? "pointer" : "grab";
      }
    },
    [getBodyAtPoint, onHoverBody, onTrackBody],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const drag = dragRef.current;
      drag.dragging = true;
      drag.userDragging = true;
      drag.dragBrokeFree = false;
      drag.dragStartX = e.clientX - rect.left;
      drag.dragStartY = e.clientY - rect.top;
      drag.dragStartPanX = panRef.current.targetPanX;
      drag.dragStartPanY = panRef.current.targetPanY;
      canvas.style.cursor = "grabbing";
    },
    [],
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const drag = dragRef.current;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) < 5) {
        const hit = getBodyAtPoint(x, y);
        if (hit) {
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
        }
      }
      drag.dragging = false;
      drag.userDragging = false;
      drag.dragBrokeFree = false;
      canvas.style.cursor = "grab";
    },
    [getBodyAtPoint, onSelectBody, zoomToBelt, bodies],
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

  const handleMouseLeave = useCallback(() => {
    onHoverBody(null);
    dragRef.current.dragging = false;
    dragRef.current.userDragging = false;
  }, [onHoverBody]);

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
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
        Scroll to zoom · Drag to pan · Click to select and follow · Double-click
        to untrack
      </div>
    </div>
  );
}
