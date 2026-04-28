import React, { useRef, useEffect, useCallback } from 'react';
import { GalaxySimulation } from '../simulation/galaxySimulation';
import { drawGalaxyBackground, drawSystemMarkers } from '../renderers/galaxyRenderer';
import { STAR_SYSTEMS } from '../data/systems';
import { GALAXY_DATA } from '../data/galaxy';
import { EXTRAGALACTIC_IDS } from '../types';
import './GalaxyCanvas.css';

const GALAXY_SCALE = 0.01;
const GALACTIC_CENTRE_WORLD_Y = -26000;
const INITIAL_ZOOM = 0.8;
const INITIAL_PAN_Y = (26000 / 2) * GALAXY_SCALE * INITIAL_ZOOM;

interface GalaxyCanvasProps {
  selectedSystem: string;
  onSelectSystem: (id: string) => void;
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

function formatExtragalacticDist(ly: number): string {
  if (ly >= 1_000_000_000) return `${(ly / 1_000_000_000).toFixed(1)} Bly`;
  if (ly >= 1_000_000) return `${(ly / 1_000_000).toFixed(1)} Mly`;
  return `${(ly / 1_000).toFixed(0)} kly`;
}

export default function GalaxyCanvas({ selectedSystem, onSelectSystem }: GalaxyCanvasProps): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const simRef = useRef<GalaxySimulation | null>(null);
  if (!simRef.current) {
    simRef.current = new GalaxySimulation(GALAXY_DATA, STAR_SYSTEMS);
  }
  const sim = simRef.current;

  const animRef = useRef<number | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const panRef = useRef<PanState>({
    panX: 0, panY: INITIAL_PAN_Y,
    targetPanX: 0, targetPanY: INITIAL_PAN_Y,
    zoom: INITIAL_ZOOM, targetZoom: INITIAL_ZOOM,
  });
  const dragRef = useRef<DragState>({
    dragging: false,
    dragStartX: 0, dragStartY: 0,
    dragStartPanX: 0, dragStartPanY: 0,
    dragBrokeFree: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ro = new ResizeObserver(entries => {
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

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pan = panRef.current;
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
      const gcy = cy + pan.panY - GALACTIC_CENTRE_WORLD_Y * scale;

      ctx.save();
      ctx.scale(dpr, dpr);

      drawGalaxyBackground(ctx, w, h, gcx, gcy, scale);
      drawSystemMarkers(ctx, sim.markers, sim.hoveredId, selectedSystem, cx, cy, pan.panX, pan.panY, scale, ts);

      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [sim, selectedSystem]);

  const hitTest = useCallback((canvasX: number, canvasY: number): string | null => {
    const { w, h } = sizeRef.current;
    const pan = panRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const scale = GALAXY_SCALE * pan.zoom;
    const worldX = (canvasX - cx - pan.panX) / scale;
    const worldY = (cy + pan.panY - canvasY) / scale;
    const hitRadiusLy = 24 / scale;
    return sim.hitTest(worldX, worldY, hitRadiusLy);
  }, [sim]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const drag = dragRef.current;
    if (drag.dragging) {
      const dx = x - drag.dragStartX;
      const dy = y - drag.dragStartY;
      if (!drag.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) drag.dragBrokeFree = true;
      panRef.current.targetPanX = drag.dragStartPanX + dx;
      panRef.current.targetPanY = drag.dragStartPanY + dy;
    } else {
      const hit = hitTest(x, y);
      sim.setHovered(hit);
      canvas.style.cursor = hit ? 'pointer' : 'grab';
    }
  }, [hitTest, sim]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const drag = dragRef.current;
    drag.dragging = true;
    drag.dragBrokeFree = false;
    drag.dragStartX = e.clientX - rect.left;
    drag.dragStartY = e.clientY - rect.top;
    drag.dragStartPanX = panRef.current.targetPanX;
    drag.dragStartPanY = panRef.current.targetPanY;
    canvas.style.cursor = 'grabbing';
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const drag = dragRef.current;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (Math.abs(x - drag.dragStartX) + Math.abs(y - drag.dragStartY) < 5) {
      const hit = hitTest(x, y);
      if (hit) onSelectSystem(hit);
    }
    drag.dragging = false;
    drag.dragBrokeFree = false;
    canvas.style.cursor = 'grab';
  }, [hitTest, onSelectSystem]);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const pan = panRef.current;
    const rect = canvasRef.current!.getBoundingClientRect();
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newZoom = Math.max(0.1, Math.min(100, pan.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    const zoomRatio = newZoom / pan.targetZoom;
    pan.targetPanX = mx - zoomRatio * (mx - (cx + pan.targetPanX)) - cx;
    pan.targetPanY = my - zoomRatio * (my - (cy + pan.targetPanY)) - cy;
    pan.targetZoom = newZoom;
  }, []);

  const handleMouseLeave = useCallback(() => {
    sim.setHovered(null);
    dragRef.current.dragging = false;
  }, [sim]);

  const extragalactic = STAR_SYSTEMS.filter(s => EXTRAGALACTIC_IDS.has(s.id));

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
      <div className="galaxy-beyond-panel">
        <div className="galaxy-beyond-title">Beyond the Milky Way</div>
        {extragalactic.map(s => (
          <button
            key={s.id}
            className={`galaxy-beyond-item${selectedSystem === s.id ? ' active' : ''}`}
            onClick={() => onSelectSystem(s.id)}
          >
            <span className="galaxy-beyond-icon">✵</span>
            <span className="galaxy-beyond-name">{s.name}</span>
            {s.distanceFromEarth && (
              <span className="galaxy-beyond-dist">{formatExtragalacticDist(s.distanceFromEarth)}</span>
            )}
          </button>
        ))}
      </div>
      <div className="galaxy-hint">
        Scroll to zoom · Drag to pan · Click to explore system
      </div>
    </div>
  );
}
