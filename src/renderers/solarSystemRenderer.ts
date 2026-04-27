import type { CelestialBody, Vec2, VisualConfig } from '../types';

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

// [angle, radius, size, opacity]
type BeltParticle = [number, number, number, number];

const beltParticleCache = new Map<string, BeltParticle[]>();

function getBeltParticles(beltId: string, visualConfig: VisualConfig): BeltParticle[] {
  if (beltParticleCache.has(beltId)) return beltParticleCache.get(beltId)!;
  const config = visualConfig.beltConfigs[beltId];
  if (!config) return [];
  const { innerRadius, outerRadius, particleCount, seed } = config;
  const rng = mulberry32(seed);
  const particles: BeltParticle[] = Array.from({ length: particleCount }, (): BeltParticle => [
    rng() * TWO_PI,
    innerRadius + rng() * (outerRadius - innerRadius),
    rng() * 1.2 + 0.4,
    rng() * 0.4 + 0.15,
  ]);
  beltParticleCache.set(beltId, particles);
  return particles;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

export function drawStarField(ctx: CanvasRenderingContext2D): void {
  // Batch into 4 alpha buckets: 300 fill calls → 4
  const buckets: StarTuple[][] = [[], [], [], []];
  for (const star of getStarField()) {
    buckets[Math.min(3, Math.floor((star[3] - 0.2) / 0.16))]?.push(star);
  }
  const alphas = [0.25, 0.41, 0.57, 0.72];
  ctx.fillStyle = '#ffffff';
  for (let b = 0; b < 4; b++) {
    ctx.globalAlpha = alphas[b];
    ctx.beginPath();
    for (const [x, y, r] of buckets[b]) {
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TWO_PI);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawBelt(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  beltId: string,
  isSelected: boolean,
  isHovered: boolean,
  showLabels: boolean,
  zoom: number,
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
): void {
  const config = visualConfig.beltConfigs[beltId];
  const body   = bodies[beltId];
  if (!config || !body) return;

  const { innerRadius, outerRadius, color } = config;
  const midRadius = (innerRadius + outerRadius) / 2;
  const ringWidth = outerRadius - innerRadius;

  if (isSelected || isHovered) {
    ctx.beginPath();
    ctx.arc(cx, cy, midRadius, 0, TWO_PI);
    ctx.strokeStyle = isSelected ? (body.glowColor ?? color) + '60' : (body.glowColor ?? color) + '30';
    ctx.lineWidth = ringWidth;
    ctx.stroke();
  }

  if (zoom < 0.7) {
    // Below this threshold most particles are sub-pixel — draw a single ring instead
    ctx.beginPath();
    ctx.arc(cx, cy, midRadius, 0, TWO_PI);
    ctx.strokeStyle = color + '48';
    ctx.lineWidth = ringWidth;
    ctx.stroke();
  } else {
    for (const [angle, radius, size, opacity] of getBeltParticles(beltId, visualConfig)) {
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.globalAlpha = (isSelected || isHovered) ? Math.min(1, opacity * 1.8) : opacity;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  if (showLabels || isSelected || isHovered) {
    ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
    ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,210,230,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(body.name, cx + outerRadius + 6, cy + 4);
    ctx.textAlign = 'center';
  }
}

export function drawOrbits(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  selectedBody: string,
  hoveredBody: string | null,
  showOrbits: boolean,
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
): void {
  const { orbitalRadii } = visualConfig;
  for (const [id, body] of Object.entries(bodies)) {
    if (!body.showOrbitRing) continue;
    const isHighlighted = id === selectedBody || id === hoveredBody;
    if (!showOrbits && !isHighlighted) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, orbitalRadii[id] ?? 0, 0, TWO_PI);
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
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, TWO_PI);
  ctx.fill();

  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#FFF5AA');
  grad.addColorStop(0.4, '#FDB813');
  grad.addColorStop(1, '#E07B00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = 'rgba(255,200,80,0.8)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function drawBodyRings(
  ctx: CanvasRenderingContext2D,
  positions: Record<string, Vec2>,
  pass: 'back' | 'front',
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
): void {
  for (const [id, body] of Object.entries(bodies)) {
    if (!body.rings?.length) continue;
    const pos = positions[id];
    if (!pos) continue;
    const r = visualConfig.planetSizes[id] ?? 18;
    ctx.save();
    ctx.translate(pos.x, pos.y);
    for (const band of body.rings) {
      const inner = r * band.innerFactor;
      const outer = r * band.outerFactor;
      const midR  = (inner + outer) / 2;
      ctx.globalAlpha = band.intensity;
      ctx.beginPath();
      ctx.ellipse(0, 0, midR, midR * 0.38, 0,
        pass === 'back' ? Math.PI : 0,
        pass === 'back' ? TWO_PI : Math.PI);
      ctx.strokeStyle = band.color;
      ctx.lineWidth = outer - inner;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}

export function drawBodies(
  ctx: CanvasRenderingContext2D,
  positions: Record<string, Vec2>,
  selectedBody: string,
  hoveredBody: string | null,
  showLabels: boolean,
  showOrbits: boolean,
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
): void {
  const { planetSizes, moonOrbitalRadii } = visualConfig;
  const allBodies = Object.entries(bodies);

  // Glows
  for (const [id, body] of allBodies) {
    if (body.type === 'belt') continue;
    const pos = positions[id];
    if (!pos) continue;
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;
    if (isSelected || isHovered) {
      const glowR = r + (isSelected ? 10 : 6);
      const grad = ctx.createRadialGradient(pos.x, pos.y, r * 0.5, pos.x, pos.y, glowR * 2);
      grad.addColorStop(0, (body.glowColor ?? body.color) + '60');
      grad.addColorStop(1, (body.glowColor ?? body.color) + '00');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowR * 2, 0, TWO_PI);
      ctx.fill();
    }
  }

  // Moon orbit rings
  for (const [id, body] of allBodies) {
    if (!showOrbits) break;
    if (body.type !== 'moon') continue;
    const parent = body.parent;
    if (!parent) continue;
    const { x: px, y: py } = positions[parent] ?? { x: 0, y: 0 };
    ctx.beginPath();
    ctx.arc(px, py, moonOrbitalRadii[id] ?? 0, 0, TWO_PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  // Bodies
  for (const [id, body] of allBodies) {
    if (body.type === 'belt') continue;
    const pos = positions[id];
    if (!pos) continue;
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;

    if (body.type === 'star') {
      drawSun(ctx, pos.x, pos.y, r, isSelected || isHovered);
    } else {
      const grad = ctx.createRadialGradient(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.1, pos.x, pos.y, r);
      grad.addColorStop(0, lighten(body.color, 40));
      grad.addColorStop(1, body.color);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      } else if (isHovered) {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      if (body.atmosphereColor) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
        ctx.strokeStyle = body.atmosphereColor;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (showLabels || isSelected || isHovered) {
      ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,210,230,0.7)';
      ctx.textAlign = 'center';
      const labelOffset = body.rings?.length ? r + 14 : r + 5;
      ctx.fillText(body.name, pos.x, pos.y - labelOffset);
    }
  }
}
