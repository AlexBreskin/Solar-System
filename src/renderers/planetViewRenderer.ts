import { CELESTIAL_BODIES } from '../data/celestialBodies';
import type { BodyId } from '../types';

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
  const rng = mulberry32(99991);
  cachedStars = Array.from({ length: 250 }, (): StarTuple => [
    rng() * 2000, rng() * 1200, rng() * 1.0 + 0.2, rng() * 0.5 + 0.15,
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
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBody(
  ctx: CanvasRenderingContext2D,
  id: BodyId,
  x: number, y: number, r: number,
  isSelected: boolean,
  isHovered: boolean,
  showLabel: boolean,
): void {
  const body = CELESTIAL_BODIES[id];
  if (!body) return;

  if (isSelected || isHovered) {
    const glowR = r * (isSelected ? 2.8 : 2.2);
    const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
    grad.addColorStop(0, (body.glowColor ?? body.color) + '55');
    grad.addColorStop(1, (body.glowColor ?? body.color) + '00');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, glowR, 0, TWO_PI); ctx.fill();
  }

  if (body.type === 'star') {
    const corona = ctx.createRadialGradient(x, y, r, x, y, r * 2.8);
    corona.addColorStop(0, 'rgba(255,160,0,0.3)');
    corona.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = corona; ctx.beginPath(); ctx.arc(x, y, r * 2.8, 0, TWO_PI); ctx.fill();
  }

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  if (body.type === 'star') {
    grad.addColorStop(0, '#FFF5AA');
    grad.addColorStop(0.4, '#FDB813');
    grad.addColorStop(1, '#E07B00');
  } else {
    grad.addColorStop(0, lighten(body.color, 40));
    grad.addColorStop(1, body.color);
  }
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.fill();

  if (body.atmosphereColor) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI);
    ctx.strokeStyle = body.atmosphereColor;
    ctx.lineWidth = Math.max(1, r * 0.1);
    ctx.stroke();
  }

  if (isSelected) {
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r + Math.max(4, r * 0.15), 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]); ctx.stroke(); ctx.setLineDash([]);
  } else if (isHovered) {
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TWO_PI); ctx.stroke();
  }

  if (showLabel) {
    const fontSize = Math.max(10, Math.min(14, r * 0.7));
    ctx.font = `${isSelected ? 600 : 400} ${fontSize}px Syne, sans-serif`;
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,210,230,0.85)';
    ctx.textAlign = 'center';
    ctx.fillText(body.name, x, y - r - Math.max(5, r * 0.2));
  }
}

export function drawBodyRings(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  r: number,
  pass: 'back' | 'front',
): void {
  const rings = [
    { inner: r * 1.10, outer: r * 1.30, color: 'rgba(200,180,140,0.5)' },
    { inner: r * 1.33, outer: r * 1.55, color: 'rgba(220,200,160,0.4)' },
    { inner: r * 1.58, outer: r * 1.75, color: 'rgba(180,160,120,0.3)' },
  ];
  const step = Math.max(0.5, r * 0.02);
  for (const ring of rings) {
    for (let ra = ring.inner; ra <= ring.outer; ra += step) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, ra, ra * 0.38, 0,
        pass === 'back' ? Math.PI : 0,
        pass === 'back' ? TWO_PI : Math.PI);
      ctx.strokeStyle = ring.color; ctx.lineWidth = 0.6; ctx.stroke();
    }
  }
}
