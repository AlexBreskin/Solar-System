import React, { useRef, useEffect, useCallback, useMemo } from "react";
import { useZoomControls } from "@/shared/hooks/useZoomControls";
import ZoomControls from "@/shared/components/ZoomControls";
import {
  PlanetViewSimulation,
  getMoonsOf,
} from "@/simulation/planetViewSimulation";
import {
  drawStarField,
  drawBody,
  drawBodyRings,
} from "@/renderers/planet-view";
import { useStarSystem } from "@/shared/contexts/StarSystemContext";
import type { BodyId, CanvasSize, PlanetCanvasProps } from "@/types";

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
  lastTime: number | null;
  pinching: boolean;
  pinchStartDist: number;
  pinchStartZoom: number;
  pinchStartPanX: number;
  pinchStartPanY: number;
  pinchCenterX: number;
  pinchCenterY: number;
}

export default function PlanetCanvas({
  planetId,
  selectedBody,
  hoveredBody,
  speed,
  paused,
  showLabels,
  onSelectBody,
  onHoverBody,
}: PlanetCanvasProps): JSX.Element {
  const { bodies } = useStarSystem();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<PlanetViewSimulation | null>(null);
  if (!simRef.current) {
    simRef.current = new PlanetViewSimulation(bodies);
  }
  const sim = simRef.current;
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

  const planet = bodies[planetId];
  const moons = useMemo(() => getMoonsOf(planetId, bodies), [planetId, bodies]);

  useEffect(() => {
    sim.initMoons(moons);
    sim.resetLayout();
    const pan = panRef.current;
    pan.zoom = 1;
    pan.panX = 0;
    pan.panY = 0;
    pan.targetZoom = 1;
    pan.targetPanX = 0;
    pan.targetPanY = 0;
  }, [planetId]);

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
        sim.resetLayout();
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [sim]);

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

      if (!paused) sim.advanceAngles(dt, speed, moons);
      const layout = sim.updatePositions(planetId, moons, cx, cy, w, h);
      const { planetR, moonSizes, moonOrbitalRadii } = layout;

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

      const hasBinary = moons.some(
        (m) => bodies[m]?.binaryMassFraction !== undefined,
      );

      // Barycenter marker for binary systems
      if (hasBinary) {
        const s = 6;
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.moveTo(cx - s, cy);
        ctx.lineTo(cx + s, cy);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - s);
        ctx.lineTo(cx, cy + s);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        if (showLabels) {
          ctx.font = "9px Syne, sans-serif";
          ctx.fillStyle = "rgba(255,255,255,0.35)";
          ctx.textAlign = "center";
          ctx.fillText("barycenter", cx, cy + s + 10);
        }
      }

      // Moon orbit rings — binary moon ring at its true orbital radius from barycenter
      for (const moonId of moons) {
        const μ = bodies[moonId]?.binaryMassFraction;
        const rawR = moonOrbitalRadii[moonId] ?? 80;
        const r = μ !== undefined ? rawR * (1 - μ) : rawR;
        const isHighlighted = moonId === selectedBody || moonId === hoveredBody;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isHighlighted
          ? "rgba(255,255,255,0.35)"
          : "rgba(255,255,255,0.18)";
        ctx.lineWidth = isHighlighted ? 1 : 0.5;
        ctx.setLineDash(isHighlighted ? [] : [3, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const pPos = sim.positions[planetId] ?? { x: cx, y: cy };
      const rings = bodies[planetId]?.rings ?? [];
      if (rings.length)
        drawBodyRings(ctx, rings, pPos.x, pPos.y, planetR, "back");
      drawBody(
        ctx,
        planetId,
        pPos.x,
        pPos.y,
        planetR,
        selectedBody === planetId,
        hoveredBody === planetId,
        true,
        bodies,
      );
      if (rings.length)
        drawBodyRings(ctx, rings, pPos.x, pPos.y, planetR, "front");

      for (const moonId of moons) {
        const pos = sim.positions[moonId];
        if (!pos) continue;
        const mr = moonSizes[moonId] ?? 5;
        drawBody(
          ctx,
          moonId,
          pos.x,
          pos.y,
          mr,
          selectedBody === moonId,
          hoveredBody === moonId,
          showLabels || selectedBody === moonId || hoveredBody === moonId,
          bodies,
        );
      }

      ctx.restore();
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [
    planetId,
    moons,
    selectedBody,
    hoveredBody,
    speed,
    paused,
    showLabels,
    sim,
    bodies,
  ]);

  const getBodyAtPoint = useCallback(
    (canvasX: number, canvasY: number): BodyId | null => {
      const { w, h } = sizeRef.current;
      const pan = panRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const wx = (canvasX - cx - pan.panX) / pan.zoom + cx;
      const wy = (canvasY - cy - pan.panY) / pan.zoom + cy;
      if (!sim.layout) return null;
      const { planetR, moonSizes } = sim.layout;
      let closest: BodyId | null = null;
      let closestDist = Infinity;
      const bodyList: BodyId[] = [planetId, ...moons];
      for (const id of bodyList) {
        const pos = sim.positions[id];
        if (!pos) continue;
        const r = Math.max(id === planetId ? planetR : (moonSizes[id] ?? 5), 8);
        const dist = Math.hypot(wx - pos.x, wy - pos.y);
        if (dist < r * 1.6 && dist < closestDist) {
          closest = id;
          closestDist = dist;
        }
      }
      return closest;
    },
    [planetId, moons, sim],
  );

  const applyPinch = useCallback(() => {
    const drag = dragRef.current;
    const pointers = Array.from(pointersRef.current.values());
    if (pointers.length < 2) return;
    const [p1, p2] = pointers;
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (drag.pinchStartDist <= 0) return;
    const newZoom = Math.max(
      0.2,
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
        drag.pinchStartDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        drag.pinchStartZoom = panRef.current.targetZoom;
        drag.pinchStartPanX = panRef.current.targetPanX;
        drag.pinchStartPanY = panRef.current.targetPanY;
        drag.pinchCenterX = (p1.x + p2.x) / 2;
        drag.pinchCenterY = (p1.y + p2.y) / 2;
      }
    },
    [],
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
        panRef.current.targetPanX = drag.dragStartPanX + (x - drag.dragStartX);
        panRef.current.targetPanY = drag.dragStartPanY + (y - drag.dragStartY);
      } else if (e.pointerType === "mouse") {
        const hit = getBodyAtPoint(x, y);
        onHoverBody(hit);
        canvas.style.cursor = hit ? "pointer" : "grab";
      }
    },
    [applyPinch, getBodyAtPoint, onHoverBody],
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

      if (drag.pinching) {
        if (pointersRef.current.size < 2) drag.pinching = false;
        if (pointersRef.current.size === 0) {
          drag.dragging = false;
          canvas.style.cursor = "grab";
        }
        return;
      }

      if (
        drag.dragging &&
        Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) < 5
      ) {
        const hit = getBodyAtPoint(x, y);
        if (hit) onSelectBody(hit);
      }

      if (pointersRef.current.size === 0) {
        drag.dragging = false;
        canvas.style.cursor = "grab";
      }
    },
    [getBodyAtPoint, onSelectBody],
  );

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pan = panRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const newZoom = Math.max(
      0.2,
      Math.min(8, pan.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)),
    );
    const zoomRatio = newZoom / pan.targetZoom;
    pan.targetPanX = mx - zoomRatio * (mx - (cx + pan.targetPanX)) - cx;
    pan.targetPanY = my - zoomRatio * (my - (cy + pan.targetPanY)) - cy;
    pan.targetZoom = newZoom;
  }, []);

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
      const drag = dragRef.current;
      if (pointersRef.current.size < 2) drag.pinching = false;
      if (pointersRef.current.size === 0) {
        drag.dragging = false;
        canvas.style.cursor = "grab";
      }
    },
    [],
  );

  const { handleZoomIn, handleZoomOut } = useZoomControls(panRef, 0.2, 8);

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
      />
      {moons.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, calc(-50% + 70px))",
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "Syne, sans-serif",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {planet?.name} has no moons in this simulation
        </div>
      )}
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
        Scroll or pinch to zoom · Drag to pan · Tap to select
      </div>
    </div>
  );
}
