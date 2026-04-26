import React, { useRef, useEffect, useCallback } from 'react';
import { PlanetViewSimulation, getMoonsOf } from '../simulation/planetViewSimulation';
import { drawStarField, drawBody, drawBodyRings } from '../renderers/planetViewRenderer';
import { CELESTIAL_BODIES } from '../data/celestialBodies';
import type { BodyId, CanvasSize, PlanetViewCanvasProps } from '../types';

interface PanState {
  panX: number; panY: number;
  targetPanX: number; targetPanY: number;
  zoom: number; targetZoom: number;
}

interface DragState {
  dragging: boolean;
  dragStartX: number; dragStartY: number;
  dragStartPanX: number; dragStartPanY: number;
  lastTime: number | null;
}

export default function PlanetViewCanvas({
  planetId, selectedBody, hoveredBody, speed, paused, showLabels,
  onSelectBody, onHoverBody,
}: PlanetViewCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef    = useRef(new PlanetViewSimulation());
  const animRef   = useRef<number | null>(null);
  const sizeRef   = useRef<CanvasSize>({ w: 0, h: 0 });
  const panRef    = useRef<PanState>({
    panX: 0, panY: 0, targetPanX: 0, targetPanY: 0, zoom: 1, targetZoom: 1,
  });
  const dragRef   = useRef<DragState>({
    dragging: false, dragStartX: 0, dragStartY: 0,
    dragStartPanX: 0, dragStartPanY: 0, lastTime: null,
  });

  const planet = CELESTIAL_BODIES[planetId];
  const moons  = getMoonsOf(planetId);

  useEffect(() => {
    simRef.current.initMoons(moons);
    simRef.current.resetLayout();
    const pan = panRef.current;
    pan.zoom = 1; pan.panX = 0; pan.panY = 0;
    pan.targetZoom = 1; pan.targetPanX = 0; pan.targetPanY = 0;
  }, [planetId]); // eslint-disable-line

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        canvas.width  = width  * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width  = `${width}px`;
        canvas.style.height = `${height}px`;
        sizeRef.current = { w: width, h: height };
        simRef.current.resetLayout();
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;
    const sim    = simRef.current;
    const pan    = panRef.current;
    const drag   = dragRef.current;
    const dpr    = window.devicePixelRatio;

    function draw(ts: number): void {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      const dt = drag.lastTime !== null ? Math.min((ts - drag.lastTime) / 1000, 0.1) : 0;
      drag.lastTime = ts;

      const cx = w / 2, cy = h / 2;

      if (!paused) sim.advanceAngles(dt, speed, moons);
      const layout = sim.updatePositions(planetId, moons, cx, cy, w, h);
      const { planetR, moonSizes, moonOrbitalRadii } = layout;

      pan.panX += (pan.targetPanX - pan.panX) * 0.1;
      pan.panY += (pan.targetPanY - pan.panY) * 0.1;
      pan.zoom += (pan.targetZoom - pan.zoom) * 0.1;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#050812';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      drawStarField(ctx);

      ctx.save();
      ctx.translate(cx + pan.panX, cy + pan.panY);
      ctx.scale(pan.zoom, pan.zoom);
      ctx.translate(-cx, -cy);

      // Moon orbit rings
      for (const moonId of moons) {
        const r = moonOrbitalRadii[moonId] ?? 80;
        const isHighlighted = moonId === selectedBody || moonId === hoveredBody;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = isHighlighted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)';
        ctx.lineWidth = isHighlighted ? 1 : 0.5;
        ctx.setLineDash(isHighlighted ? [] : [3, 8]);
        ctx.stroke(); ctx.setLineDash([]);
      }

      if (CELESTIAL_BODIES[planetId]?.hasRings) drawBodyRings(ctx, cx, cy, planetR, 'back');
      drawBody(ctx, planetId, cx, cy, planetR,
        selectedBody === planetId, hoveredBody === planetId, true);
      if (CELESTIAL_BODIES[planetId]?.hasRings) drawBodyRings(ctx, cx, cy, planetR, 'front');

      for (const moonId of moons) {
        const pos = sim.positions[moonId];
        if (!pos) continue;
        const mr = moonSizes[moonId] ?? 5;
        drawBody(ctx, moonId, pos.x, pos.y, mr,
          selectedBody === moonId, hoveredBody === moonId,
          showLabels || selectedBody === moonId || hoveredBody === moonId);
      }

      ctx.restore();
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [planetId, moons, selectedBody, hoveredBody, speed, paused, showLabels]); // eslint-disable-line

  const getBodyAtPoint = useCallback((canvasX: number, canvasY: number): BodyId | null => {
    const { w, h } = sizeRef.current;
    const pan = panRef.current;
    const sim = simRef.current;
    const cx = w / 2, cy = h / 2;
    const wx = (canvasX - cx - pan.panX) / pan.zoom + cx;
    const wy = (canvasY - cy - pan.panY) / pan.zoom + cy;
    if (!sim.layout) return null;
    const { planetR, moonSizes } = sim.layout;
    let closest: BodyId | null = null, closestDist = Infinity;
    const bodies: BodyId[] = [planetId, ...moons];
    for (const id of bodies) {
      const pos = sim.positions[id];
      if (!pos) continue;
      const r = Math.max(id === planetId ? planetR : (moonSizes[id] ?? 5), 8);
      const dist = Math.hypot(wx - pos.x, wy - pos.y);
      if (dist < r * 1.6 && dist < closestDist) { closest = id; closestDist = dist; }
    }
    return closest;
  }, [planetId, moons]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const drag = dragRef.current;
    if (drag.dragging) {
      panRef.current.targetPanX = drag.dragStartPanX + (x - drag.dragStartX);
      panRef.current.targetPanY = drag.dragStartPanY + (y - drag.dragStartY);
    } else {
      const hit = getBodyAtPoint(x, y);
      onHoverBody(hit);
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  }, [getBodyAtPoint, onHoverBody]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const drag = dragRef.current;
    drag.dragging = true;
    drag.dragStartX = e.clientX - rect.left; drag.dragStartY = e.clientY - rect.top;
    drag.dragStartPanX = panRef.current.targetPanX;
    drag.dragStartPanY = panRef.current.targetPanY;
    canvas.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const drag = dragRef.current;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    if (Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) < 5) {
      const hit = getBodyAtPoint(x, y);
      if (hit) onSelectBody(hit);
    }
    drag.dragging = false;
    canvas.style.cursor = 'grab';
  }, [getBodyAtPoint, onSelectBody]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pan = panRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const cx = w / 2, cy = h / 2;
    const newZoom   = Math.max(0.2, Math.min(8, pan.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    const zoomRatio = newZoom / pan.targetZoom;
    pan.targetPanX = mx - zoomRatio * (mx - (cx + pan.targetPanX)) - cx;
    pan.targetPanY = my - zoomRatio * (my - (cy + pan.targetPanY)) - cy;
    pan.targetZoom = newZoom;
  }, []);

  const handleMouseLeave = useCallback(() => {
    onHoverBody(null);
    dragRef.current.dragging = false;
  }, [onHoverBody]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      {moons.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, calc(-50% + 70px))',
          fontSize: 12, color: 'rgba(255,255,255,0.2)',
          fontFamily: 'Syne, sans-serif', pointerEvents: 'none', textAlign: 'center',
        }}>
          {planet?.name} has no known moons in this simulation
        </div>
      )}
      <div style={{
        position: 'absolute', bottom: 16, left: 16,
        fontSize: 11, color: 'rgba(255,255,255,0.25)',
        fontFamily: 'Syne, sans-serif', pointerEvents: 'none', lineHeight: 1.8,
      }}>
        Scroll to zoom · Drag to pan · Click to select
      </div>
    </div>
  );
}
