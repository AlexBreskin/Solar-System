import { mulberry32 } from "../../utils/mulberry32";

const TWO_PI = Math.PI * 2;

export type GalParticle = [number, number, number, string];

function gaussianRng(rng: () => number): number {
  const u1 = Math.max(1e-10, rng());
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(TWO_PI * u2);
}

function armParticleColor(r: number): string {
  if (r < 4000) return "#FFF4C0";
  if (r < 12000) return "#FFE8A0";
  if (r < 22000) return "#D8E8FF";
  return "#A8C4FF";
}

// Bar geometry — angles match SVG reference (rotate(-55) for Galactic Bar, rotate(-45) for Long Bar).
// Negative rotation = CCW in canvas = upper-right → lower-left orientation on screen.
const GALACTIC_BAR_ANGLE = (Math.PI * 55) / 180;
const GALACTIC_BAR_COS = Math.cos(GALACTIC_BAR_ANGLE);
const GALACTIC_BAR_SIN = Math.sin(GALACTIC_BAR_ANGLE);
const GALACTIC_BAR_MINOR_RATIO = 0.4; // ry/rx = 40/100 from SVG, 2.5:1 aspect

function barEllipsePoint(rng: () => number, rMajor: number): [number, number] {
  const theta = rng() * TWO_PI;
  const ex = rMajor * Math.cos(theta);
  const ey = rMajor * GALACTIC_BAR_MINOR_RATIO * Math.sin(theta);
  return [
    ex * GALACTIC_BAR_COS + ey * GALACTIC_BAR_SIN,
    -ex * GALACTIC_BAR_SIN + ey * GALACTIC_BAR_COS,
  ];
}

function pushBulgeParticles(
  p: GalParticle[],
  rng: () => number,
  count: number,
  power: number,
  semiMajor: number,
  taperRef: number,
  alphaMin: number,
  alphaRange: number,
  minR = 0,
): void {
  for (let i = 0; i < count; i++) {
    const rMajor = minR + Math.pow(rng(), power) * semiMajor;
    const [bx, by] = barEllipsePoint(rng, rMajor);
    const r = Math.sqrt(bx * bx + by * by);
    const taper = Math.exp(-2.5 * Math.pow(rMajor / taperRef, 2));
    p.push([
      bx,
      by,
      (rng() * alphaRange + alphaMin) * taper,
      armParticleColor(r),
    ]);
  }
}

function pushDiskParticles(
  p: GalParticle[],
  rng: () => number,
  count: number,
  minR: number,
  power: number,
  spread: number,
  maxR: number,
  alphaRange: number,
  alphaMin: number,
): void {
  for (let i = 0; i < count; i++) {
    const r = minR + Math.pow(rng(), power) * spread;
    if (r > maxR) {
      rng();
      continue;
    }
    const theta = rng() * TWO_PI;
    p.push([
      r * Math.cos(theta),
      r * Math.sin(theta),
      rng() * alphaRange + alphaMin,
      armParticleColor(r),
    ]);
  }
}

interface ArmParams {
  offsets: number[];
  count: number;
  maxR: number;
  scatterFactor: number;
  tjFactor: number;
  dfDenom: number;
  alphaMin: number;
  alphaRange: number;
  dvBase: number;
  dvScale: number;
  tRange?: number;
  tStart?: number;
}

function pushArmParticles(
  p: GalParticle[],
  rng: () => number,
  params: ArmParams,
): void {
  const {
    offsets,
    count,
    maxR,
    scatterFactor,
    tjFactor,
    dfDenom,
    alphaMin,
    alphaRange,
    dvBase,
    dvScale,
    tRange = Math.PI * 4.5,
    tStart = 0.4,
  } = params;
  for (const off of offsets) {
    for (let i = 0; i < count; i++) {
      const t = (i / count) * tRange + tStart;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > maxR) break;
      const scatter = gaussianRng(rng) * r * scatterFactor;
      const tj = gaussianRng(rng) * tjFactor;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * dfDenom);
      const aScale = Math.max(0.1, 1 - df * df);
      const dv = dvBase + dvScale * Math.sin(t * 5 + off * 1.3);
      p.push([
        px,
        py,
        (rng() * alphaRange + alphaMin) * aScale * dv,
        armParticleColor(r),
      ]);
    }
  }
}

// --- LOD 0: best at zoom < 1.5. ---

let lod0Particles: GalParticle[] | null = null;

function getLOD0Particles(): GalParticle[] {
  if (lod0Particles) return lod0Particles;
  const rng = mulberry32(77777);
  const p: GalParticle[] = [];

  pushBulgeParticles(p, rng, 7000, 0.45, 10000, 10000, 0.08, 0.35);
  pushDiskParticles(p, rng, 22000, 2000, 0.6, 48000, Infinity, 0.07, 0.02);
  for (let i = 0; i < 4000; i++) {
    const r = 18000 + rng() * 34000;
    const theta = rng() * TWO_PI;
    p.push([
      r * Math.cos(theta),
      r * Math.sin(theta),
      rng() * 0.04 + 0.01,
      "#A8C4FF",
    ]);
  }
  pushArmParticles(p, rng, {
    offsets: [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2],
    count: 8000,
    maxR: 52000,
    scatterFactor: 0.06,
    tjFactor: 0.035,
    dfDenom: 0.12,
    alphaMin: 0.15,
    alphaRange: 0.4,
    dvBase: 0.65,
    dvScale: 0.35,
  });
  pushArmParticles(p, rng, {
    offsets: [Math.PI / 4, Math.PI + Math.PI / 4],
    count: 4000,
    maxR: 52000,
    scatterFactor: 0.06,
    tjFactor: 0.035,
    dfDenom: 0.12,
    alphaMin: 0.1,
    alphaRange: 0.28,
    dvBase: 1,
    dvScale: 0,
  });
  pushArmParticles(p, rng, {
    offsets: [(Math.PI * 3) / 8, Math.PI + (Math.PI * 3) / 8],
    count: 2000,
    maxR: 38000,
    scatterFactor: 0.055,
    tjFactor: 0.03,
    dfDenom: 0.11,
    alphaMin: 0.08,
    alphaRange: 0.2,
    dvBase: 1,
    dvScale: 0,
    tRange: Math.PI * 2.8,
    tStart: 0.8,
  });

  lod0Particles = p;
  return p;
}

// --- LOD 1: best at zoom 1–4. ---

const LOD1_MAX_R = 22000;
let lod1Particles: GalParticle[] | null = null;

function getLOD1Particles(): GalParticle[] {
  if (lod1Particles) return lod1Particles;
  const rng = mulberry32(88888);
  const p: GalParticle[] = [];

  pushBulgeParticles(p, rng, 9000, 0.5, 9000, 9000, 0.08, 0.35);
  pushDiskParticles(p, rng, 32000, 800, 0.65, 20000, LOD1_MAX_R, 0.08, 0.025);
  pushArmParticles(p, rng, {
    offsets: [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2],
    count: 10000,
    maxR: LOD1_MAX_R,
    scatterFactor: 0.07,
    tjFactor: 0.04,
    dfDenom: 0.14,
    alphaMin: 0.16,
    alphaRange: 0.42,
    dvBase: 0.65,
    dvScale: 0.35,
  });
  pushArmParticles(p, rng, {
    offsets: [Math.PI / 4, Math.PI + Math.PI / 4],
    count: 7000,
    maxR: LOD1_MAX_R,
    scatterFactor: 0.07,
    tjFactor: 0.04,
    dfDenom: 0.14,
    alphaMin: 0.1,
    alphaRange: 0.3,
    dvBase: 1,
    dvScale: 0,
  });

  lod1Particles = p;
  return p;
}

// --- LOD 2: best at zoom 3+. ---

const LOD2_MAX_R = 9000;
let lod2Particles: GalParticle[] | null = null;

function getLOD2Particles(): GalParticle[] {
  if (lod2Particles) return lod2Particles;
  const rng = mulberry32(99999);
  const p: GalParticle[] = [];

  pushBulgeParticles(p, rng, 7000, 0.7, LOD2_MAX_R, LOD2_MAX_R, 0.08, 0.35);
  pushBulgeParticles(p, rng, 4500, 0.8, 8000, LOD2_MAX_R, 0.01, 0.06, 500);
  pushArmParticles(p, rng, {
    offsets: [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2],
    count: 6000,
    maxR: LOD2_MAX_R,
    scatterFactor: 0.08,
    tjFactor: 0.045,
    dfDenom: 0.16,
    alphaMin: 0.12,
    alphaRange: 0.32,
    dvBase: 0.7,
    dvScale: 0.3,
  });
  pushArmParticles(p, rng, {
    offsets: [Math.PI / 4, Math.PI + Math.PI / 4],
    count: 4000,
    maxR: LOD2_MAX_R,
    scatterFactor: 0.08,
    tjFactor: 0.045,
    dfDenom: 0.16,
    alphaMin: 0.08,
    alphaRange: 0.22,
    dvBase: 1,
    dvScale: 0,
  });

  lod2Particles = p;
  return p;
}

// --- Offscreen canvas helpers ---

const LOD0_SIZE = 1024;
export const LOD0_HALF_LY = 56000;
const LOD1_SIZE = 2048;
export const LOD1_HALF_LY = 22000;
const LOD2_SIZE = 2048;
export const LOD2_HALF_LY = 9000;

// brightPixelSize: particles with alpha > 0.09 render at this size (px).
// Use 2 for LOD 0 so arm stars survive the downscale at full-galaxy zoom.
function buildOffscreen(
  size: number,
  halfLY: number,
  particles: GalParticle[],
  brightPixelSize = 1,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const s = size / (2 * halfLY);
  const c = size / 2;
  let currentColor = "";
  for (const [galX, galY, alpha, color] of particles) {
    const px = c + galX * s;
    const py = c + galY * s;
    if (px < 0 || px > size || py < 0 || py > size) continue;
    if (color !== currentColor) {
      ctx.fillStyle = color;
      currentColor = color;
    }
    ctx.globalAlpha = alpha;
    const ps = alpha > 0.09 ? brightPixelSize : 1;
    ctx.fillRect(Math.round(px), Math.round(py), ps, ps);
  }
  ctx.globalAlpha = 1;
  return canvas;
}

let lod0Offscreen: HTMLCanvasElement | null = null;
let lod1Offscreen: HTMLCanvasElement | null = null;
let lod2Offscreen: HTMLCanvasElement | null = null;

export function getLOD0Offscreen(): HTMLCanvasElement {
  return (lod0Offscreen ??= buildOffscreen(
    LOD0_SIZE,
    LOD0_HALF_LY,
    getLOD0Particles(),
    2,
  ));
}
export function getLOD1Offscreen(): HTMLCanvasElement {
  return (lod1Offscreen ??= buildOffscreen(
    LOD1_SIZE,
    LOD1_HALF_LY,
    getLOD1Particles(),
  ));
}
export function getLOD2Offscreen(): HTMLCanvasElement {
  return (lod2Offscreen ??= buildOffscreen(
    LOD2_SIZE,
    LOD2_HALF_LY,
    getLOD2Particles(),
  ));
}
