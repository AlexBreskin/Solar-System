import { CELESTIAL_BODIES, VISUAL_CONFIG } from '../data/celestialBodies';
import type { BodyId, Vec2 } from '../types';

const TWO_PI = Math.PI * 2;

type StarTuple = [number, number, number, number];

function mulberry32(seed: number): () => number {
  return function () {
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let cachedStars: StarTuple[] | null = null;
function getStarField(): StarTuple[] {
  if (cachedStars) return cachedStars;
  const rng = mulberry32(12345);
  cachedStars = Array.from({ length: 300 }, (): StarTuple => [
    rng() * 2000, rng() * 1200, rng() * 1.2 + 0.3, rng() * 0.6 + 0.2,
  ]);
  return cachedStars;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

export function drawStarField(ctx: CanvasRenderingContext2D): void {
  for (const [x, y, r, a] of getStarField()) {
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawOrbits(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  selectedBody: BodyId,
  hoveredBody: BodyId | null,
  showOrbits: boolean,
): void {
  const { orbitalRadii } = VISUAL_CONFIG;
  const planets: BodyId[] = ['mercury', 'venus', 'earth', 'mars', 'ceres', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  for (const p of planets) {
    const isHighlighted = p === selectedBody || p === hoveredBody;
    if (!showOrbits && !isHighlighted) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitalRadii[p] ?? 0, 0, TWO_PI);
    if (isHighlighted) {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.30)';
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 8]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, r: number,
  active: boolean,
): void {
  const corona = ctx.createRadialGradient(x, y, r, x, y, r * 3.5);
  corona.addColorStop(0, 'rgba(255,160,0,0.3)');
  corona.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = corona;
  ctx.beginPath(); ctx.arc(x, y, r * 3.5, 0, TWO_PI); ctx.fill();

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#FFF5AA');
  grad.addColorStop(0.4, '#FDB813');
  grad.addColorStop(1, '#E07B00');
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
  if (active) { ctx.strokeStyle = 'rgba(255,200,80,0.8)'; ctx.lineWidth = 1.5; ctx.stroke(); }
}

export function drawSaturnBody(
  ctx: CanvasRenderingContext2D,
  pos: Vec2,
  isSelected: boolean,
  isHovered: boolean,
  showLabels: boolean,
): void {
  const r = VISUAL_CONFIG.planetSizes['saturn'] ?? 18;
  const body = CELESTIAL_BODIES['saturn'];
  const grad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.1, pos.x, pos.y, r);
  grad.addColorStop(0, lighten(body.color, 40));
  grad.addColorStop(1, body.color);
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, TWO_PI); ctx.fill();
  if (isSelected) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
  } else if (isHovered) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke();
  }
  if (showLabels || isSelected || isHovered) {
    ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,210,230,0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('Saturn', pos.x, pos.y - r - 14);
  }
}

export function drawSaturnRings(
  ctx: CanvasRenderingContext2D,
  positions: Record<BodyId, Vec2>,
  pass: 'back' | 'front',
): void {
  const pos = positions['saturn'];
  const r = VISUAL_CONFIG.planetSizes['saturn'] ?? 18;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  const rings = [
    { inner: r + 3,  outer: r + 8,  color: 'rgba(200,180,140,0.5)' },
    { inner: r + 9,  outer: r + 14, color: 'rgba(220,200,160,0.4)' },
    { inner: r + 15, outer: r + 19, color: 'rgba(180,160,120,0.3)' },
  ];
  for (const ring of rings) {
    for (let ra = ring.inner; ra <= ring.outer; ra += 0.5) {
      ctx.beginPath();
      ctx.ellipse(0, 0, ra, ra * 0.38, 0,
        pass === 'back' ? Math.PI : 0,
        pass === 'back' ? TWO_PI : Math.PI);
      ctx.strokeStyle = ring.color; ctx.lineWidth = 0.5; ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawBodies(
  ctx: CanvasRenderingContext2D,
  positions: Record<BodyId, Vec2>,
  selectedBody: BodyId,
  hoveredBody: BodyId | null,
  showLabels: boolean,
): void {
  const { planetSizes, moonOrbitalRadii } = VISUAL_CONFIG;
  const allBodies = Object.keys(CELESTIAL_BODIES) as BodyId[];

  // Glows
  for (const id of allBodies) {
    const body = CELESTIAL_BODIES[id];
    const pos = positions[id];
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;
    if (isSelected || isHovered) {
      const glowR = r + (isSelected ? 10 : 6);
      const grad = ctx.createRadialGradient(pos.x, pos.y, r * 0.5, pos.x, pos.y, glowR * 2);
      grad.addColorStop(0, (body.glowColor ?? body.color) + '60');
      grad.addColorStop(1, (body.glowColor ?? body.color) + '00');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, glowR * 2, 0, TWO_PI); ctx.fill();
    }
  }

  // Moon orbit rings
  const moonParentMap: Partial<Record<BodyId, BodyId>> = {
    moon: 'earth', phobos: 'mars', deimos: 'mars',
    io: 'jupiter', europa: 'jupiter', ganymede: 'jupiter', callisto: 'jupiter',
    titan: 'saturn', enceladus: 'saturn', triton: 'neptune',
  };
  for (const [moon, parent] of Object.entries(moonParentMap) as [BodyId, BodyId][]) {
    const { x: px, y: py } = positions[parent];
    ctx.beginPath();
    ctx.arc(px, py, moonOrbitalRadii[moon] ?? 0, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Bodies
  for (const id of allBodies) {
    if (id === 'saturn') continue;
    const body = CELESTIAL_BODIES[id];
    const pos = positions[id];
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;

    if (id === 'sun') {
      drawSun(ctx, pos.x, pos.y, r, isSelected || isHovered);
    } else {
      const grad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.1, pos.x, pos.y, r);
      grad.addColorStop(0, lighten(body.color, 40));
      grad.addColorStop(1, body.color);
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, TWO_PI); ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1; ctx.stroke();
      }

      if (id === 'earth') {
        ctx.beginPath(); ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(100,180,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    if (showLabels || isSelected || isHovered) {
      ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,210,230,0.7)';
      ctx.textAlign = 'center';
      ctx.fillText(body.name, pos.x, pos.y - r - 5);
    }
  }

  drawSaturnBody(ctx, positions['saturn'], selectedBody === 'saturn', hoveredBody === 'saturn', showLabels);
}
