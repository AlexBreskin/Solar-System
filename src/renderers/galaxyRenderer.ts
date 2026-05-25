import { mulberry32 } from "../utils/mulberry32";
import type { GalaxyMarker } from "../simulation/galaxySimulation";
import type { GalaxyRegion } from "../types";

const TWO_PI = Math.PI * 2;

// x, y, alpha, colour
type GalParticle = [number, number, number, string];

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

const LONG_BAR_ANGLE = Math.PI / 4;
const LONG_BAR_MINOR_RATIO = 1 / 6; // ry/rx = 20/120 from SVG, 6:1 aspect

// Returns an (x, y) position sampled from a bar-elongated elliptical shell at major radius rMajor.
// Negative rotation matrix: upper-right → lower-left, matching SVG rotate(-55) for the Galactic Bar.
function barEllipsePoint(rng: () => number, rMajor: number): [number, number] {
  const theta = rng() * TWO_PI;
  const ex = rMajor * Math.cos(theta);
  const ey = rMajor * GALACTIC_BAR_MINOR_RATIO * Math.sin(theta);
  return [
    ex * GALACTIC_BAR_COS + ey * GALACTIC_BAR_SIN,
    -ex * GALACTIC_BAR_SIN + ey * GALACTIC_BAR_COS,
  ];
}

// --- LOD 0: full galaxy ±56 Kly, 1024×1024. Best at zoom < 1.5. ---

let lod0Particles: GalParticle[] | null = null;

function getLOD0Particles(): GalParticle[] {
  if (lod0Particles) return lod0Particles;
  const rng = mulberry32(77777);
  const p: GalParticle[] = [];

  // Dense central bulge — bar-shaped, Gaussian taper toward tips
  for (let i = 0; i < 7000; i++) {
    const rMajor = Math.pow(rng(), 0.45) * 10000;
    const [bx, by] = barEllipsePoint(rng, rMajor);
    const r = Math.sqrt(bx * bx + by * by);
    const taper = Math.exp(-2.5 * Math.pow(rMajor / 10000, 2));
    p.push([bx, by, (rng() * 0.35 + 0.08) * taper, armParticleColor(r)]);
  }
  // Continuous stellar disk — this is what makes it look like a galaxy, not isolated arms
  for (let i = 0; i < 22000; i++) {
    const r = 2000 + Math.pow(rng(), 0.6) * 48000;
    const theta = rng() * TWO_PI;
    p.push([
      r * Math.cos(theta),
      r * Math.sin(theta),
      rng() * 0.07 + 0.02,
      armParticleColor(r),
    ]);
  }
  // Outer disk scatter (dim, beyond arms)
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
  // 4 major arms — negative sin gives CW winding on screen
  for (const off of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    for (let i = 0; i < 8000; i++) {
      const t = (i / 8000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 52000) continue;
      const scatter = gaussianRng(rng) * r * 0.06;
      const tj = gaussianRng(rng) * 0.035;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.12);
      const aScale = Math.max(0.1, 1 - df * df);
      const dv = 0.65 + 0.35 * Math.sin(t * 5 + off * 1.3);
      p.push([px, py, (rng() * 0.4 + 0.15) * aScale * dv, armParticleColor(r)]);
    }
  }
  // 2 minor arms
  for (const off of [Math.PI / 4, Math.PI + Math.PI / 4]) {
    for (let i = 0; i < 4000; i++) {
      const t = (i / 4000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 52000) continue;
      const scatter = gaussianRng(rng) * r * 0.06;
      const tj = gaussianRng(rng) * 0.035;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.12);
      const aScale = Math.max(0.1, 1 - df * df);
      p.push([px, py, (rng() * 0.28 + 0.1) * aScale, armParticleColor(r)]);
    }
  }
  // 2 spur arms
  for (const off of [(Math.PI * 3) / 8, Math.PI + (Math.PI * 3) / 8]) {
    for (let i = 0; i < 2000; i++) {
      const t = (i / 2000) * Math.PI * 2.8 + 0.8;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 38000) continue;
      const scatter = gaussianRng(rng) * r * 0.055;
      const tj = gaussianRng(rng) * 0.03;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.11);
      const aScale = Math.max(0.1, 1 - df * df);
      p.push([px, py, (rng() * 0.2 + 0.08) * aScale, armParticleColor(r)]);
    }
  }

  lod0Particles = p;
  return p;
}

// --- LOD 1: inner galaxy ±22 Kly, 2048×2048. Best at zoom 1–4. ---

const LOD1_MAX_R = 22000;
let lod1Particles: GalParticle[] | null = null;

function getLOD1Particles(): GalParticle[] {
  if (lod1Particles) return lod1Particles;
  const rng = mulberry32(88888);
  const p: GalParticle[] = [];

  // Dense central bulge — bar-shaped, Gaussian taper toward tips
  for (let i = 0; i < 9000; i++) {
    const rMajor = Math.pow(rng(), 0.5) * 9000;
    const [bx, by] = barEllipsePoint(rng, rMajor);
    const r = Math.sqrt(bx * bx + by * by);
    const taper = Math.exp(-2.5 * Math.pow(rMajor / 9000, 2));
    p.push([bx, by, (rng() * 0.35 + 0.08) * taper, armParticleColor(r)]);
  }
  // Continuous inner disk — the background field that fills all inter-arm space
  for (let i = 0; i < 32000; i++) {
    const r = 800 + Math.pow(rng(), 0.65) * 20000;
    if (r > LOD1_MAX_R) {
      rng();
      continue;
    }
    const theta = rng() * TWO_PI;
    p.push([
      r * Math.cos(theta),
      r * Math.sin(theta),
      rng() * 0.08 + 0.025,
      armParticleColor(r),
    ]);
  }
  // 4 major arms — dense, with Gaussian cross-section
  for (const off of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    for (let i = 0; i < 10000; i++) {
      const t = (i / 10000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > LOD1_MAX_R) break;
      const scatter = gaussianRng(rng) * r * 0.07;
      const tj = gaussianRng(rng) * 0.04;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.14);
      const aScale = Math.max(0.1, 1 - df * df);
      const dv = 0.65 + 0.35 * Math.sin(t * 5 + off * 1.3);
      p.push([
        px,
        py,
        (rng() * 0.42 + 0.16) * aScale * dv,
        armParticleColor(r),
      ]);
    }
  }
  // 2 minor arms
  for (const off of [Math.PI / 4, Math.PI + Math.PI / 4]) {
    for (let i = 0; i < 7000; i++) {
      const t = (i / 7000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > LOD1_MAX_R) break;
      const scatter = gaussianRng(rng) * r * 0.07;
      const tj = gaussianRng(rng) * 0.04;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.14);
      const aScale = Math.max(0.1, 1 - df * df);
      p.push([px, py, (rng() * 0.3 + 0.1) * aScale, armParticleColor(r)]);
    }
  }

  lod1Particles = p;
  return p;
}

// --- LOD 2: core ±9 Kly, 2048×2048. Best at zoom 3+. ---

const LOD2_MAX_R = 9000;
let lod2Particles: GalParticle[] | null = null;

function getLOD2Particles(): GalParticle[] {
  if (lod2Particles) return lod2Particles;
  const rng = mulberry32(99999);
  const p: GalParticle[] = [];

  // Central disk — bar-shaped, Gaussian taper toward tips
  for (let i = 0; i < 7000; i++) {
    const rMajor = Math.pow(rng(), 0.7) * LOD2_MAX_R;
    const [bx, by] = barEllipsePoint(rng, rMajor);
    const r = Math.sqrt(bx * bx + by * by);
    const taper = Math.exp(-2.5 * Math.pow(rMajor / LOD2_MAX_R, 2));
    p.push([bx, by, (rng() * 0.35 + 0.08) * taper, armParticleColor(r)]);
  }
  // Core diffuse — also bar-shaped with taper
  for (let i = 0; i < 4500; i++) {
    const rMajor = 500 + Math.pow(rng(), 0.8) * 8000;
    const [bx, by] = barEllipsePoint(rng, rMajor);
    const r = Math.sqrt(bx * bx + by * by);
    const taper = Math.exp(-2.5 * Math.pow(rMajor / LOD2_MAX_R, 2));
    p.push([bx, by, (rng() * 0.06 + 0.01) * taper, armParticleColor(r)]);
  }
  for (const off of [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2]) {
    for (let i = 0; i < 6000; i++) {
      const t = (i / 6000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > LOD2_MAX_R) break;
      const scatter = gaussianRng(rng) * r * 0.08;
      const tj = gaussianRng(rng) * 0.045;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.16);
      const aScale = Math.max(0.1, 1 - df * df);
      const dv = 0.7 + 0.3 * Math.sin(t * 5 + off * 1.3);
      p.push([
        px,
        py,
        (rng() * 0.32 + 0.12) * aScale * dv,
        armParticleColor(r),
      ]);
    }
  }
  for (const off of [Math.PI / 4, Math.PI + Math.PI / 4]) {
    for (let i = 0; i < 4000; i++) {
      const t = (i / 4000) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > LOD2_MAX_R) break;
      const scatter = gaussianRng(rng) * r * 0.08;
      const tj = gaussianRng(rng) * 0.045;
      const theta = t + off + tj;
      const px = (r + scatter) * Math.cos(theta);
      const py = -(r + scatter) * Math.sin(theta);
      const df = Math.abs(scatter) / (r * 0.16);
      const aScale = Math.max(0.1, 1 - df * df);
      p.push([px, py, (rng() * 0.22 + 0.08) * aScale, armParticleColor(r)]);
    }
  }

  lod2Particles = p;
  return p;
}

// --- Offscreen canvas helpers ---

const LOD0_SIZE = 1024;
const LOD0_HALF_LY = 56000;
const LOD1_SIZE = 2048;
const LOD1_HALF_LY = 22000;
const LOD2_SIZE = 2048;
const LOD2_HALF_LY = 9000;

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

function getLOD0Offscreen(): HTMLCanvasElement {
  return (lod0Offscreen ??= buildOffscreen(
    LOD0_SIZE,
    LOD0_HALF_LY,
    getLOD0Particles(),
    2,
  ));
}
function getLOD1Offscreen(): HTMLCanvasElement {
  return (lod1Offscreen ??= buildOffscreen(
    LOD1_SIZE,
    LOD1_HALF_LY,
    getLOD1Particles(),
  ));
}
function getLOD2Offscreen(): HTMLCanvasElement {
  return (lod2Offscreen ??= buildOffscreen(
    LOD2_SIZE,
    LOD2_HALF_LY,
    getLOD2Particles(),
  ));
}

// Arm guide configs at module level so world points can be pre-computed alongside them
const armGuideConfigs = [
  { offset: 0, opacity: 0.07 },
  { offset: Math.PI / 2, opacity: 0.07 },
  { offset: Math.PI, opacity: 0.07 },
  { offset: (Math.PI * 3) / 2, opacity: 0.07 },
  { offset: Math.PI / 4, opacity: 0.04 },
  { offset: Math.PI + Math.PI / 4, opacity: 0.04 },
  { offset: (Math.PI * 3) / 8, opacity: 0.025 },
  { offset: Math.PI + (Math.PI * 3) / 8, opacity: 0.025 },
];

let armGuideWorldPoints: Array<Array<[number, number]>> | null = null;

function getArmGuidePoints(): Array<Array<[number, number]>> {
  if (armGuideWorldPoints) return armGuideWorldPoints;
  armGuideWorldPoints = armGuideConfigs.map(({ offset }) => {
    const points: Array<[number, number]> = [];
    for (let i = 0; i <= 300; i++) {
      const t = (i / 300) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 52000) break;
      const theta = t + offset;
      points.push([r * Math.cos(theta), -r * Math.sin(theta)]);
    }
    return points;
  });
  return armGuideWorldPoints;
}

// Marker bitmaps pre-rendered per (rootType, starColor) — eliminates per-frame gradient creation
const MARKER_SIZE = 64;
const MARKER_BASE_R = 12;
const markerBitmapCache = new Map<string, HTMLCanvasElement>();

function getMarkerBitmap(
  rootType: string,
  starColor: string,
): HTMLCanvasElement {
  const key = `${rootType}:${starColor}`;
  const cached = markerBitmapCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = MARKER_SIZE;
  canvas.height = MARKER_SIZE;
  const bctx = canvas.getContext("2d")!;
  const cx = MARKER_SIZE / 2;
  const cy = MARKER_SIZE / 2;
  const r = MARKER_BASE_R;
  if (rootType === "black-hole") {
    const ring = bctx.createRadialGradient(cx, cy, r * 0.4, cx, cy, r * 2.2);
    ring.addColorStop(0, "rgba(220,110,30,0.75)");
    ring.addColorStop(1, "rgba(180,70,10,0)");
    bctx.fillStyle = ring;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 2.2, 0, TWO_PI);
    bctx.fill();
    bctx.fillStyle = "#050202";
    bctx.beginPath();
    bctx.arc(cx, cy, r, 0, TWO_PI);
    bctx.fill();
  } else if (rootType === "neutron-star") {
    const grad = bctx.createRadialGradient(cx, cy, 0, cx, cy, r * 1.6);
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.3, "#B8D8FF");
    grad.addColorStop(1, "rgba(80,140,255,0)");
    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.arc(cx, cy, r * 1.6, 0, TWO_PI);
    bctx.fill();
  } else {
    const grad = bctx.createRadialGradient(
      cx - r * 0.25,
      cy - r * 0.25,
      0,
      cx,
      cy,
      r,
    );
    grad.addColorStop(0, "#FFFFFF");
    grad.addColorStop(0.45, starColor);
    grad.addColorStop(1, starColor + "AA");
    bctx.fillStyle = grad;
    bctx.beginPath();
    bctx.arc(cx, cy, r, 0, TWO_PI);
    bctx.fill();
  }
  markerBitmapCache.set(key, canvas);
  return canvas;
}

function hashTile(tx: number, ty: number): number {
  const a = (Math.imul(tx, 0x6d2b79f5) ^ Math.imul(ty, 0x4a0d6e3f)) | 0;
  return ((a ^ (a >>> 15)) * 0x735a2d97) >>> 0;
}

function drawViewportStars(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gcx: number,
  gcy: number,
  scale: number,
  largeStars: boolean,
  globalFade: number,
): void {
  if (globalFade <= 0) return;
  const TARGET_PX = largeStars ? 28 : 22;
  const STARS_PER_TILE = 4;
  const MAX_TILES = 2500;
  const rawLY = TARGET_PX / scale;
  const TILE_LY = Math.pow(2, Math.ceil(Math.log2(Math.max(1, rawLY))));

  const wxMin = (0 - gcx) / scale;
  const wxMax = (w - gcx) / scale;
  const wyMin = (0 - gcy) / scale;
  const wyMax = (h - gcy) / scale;

  const txMin = Math.floor(wxMin / TILE_LY);
  const txMax = Math.floor(wxMax / TILE_LY);
  const tyMin = Math.floor(wyMin / TILE_LY);
  const tyMax = Math.floor(wyMax / TILE_LY);

  if ((txMax - txMin + 1) * (tyMax - tyMin + 1) > MAX_TILES) return;

  ctx.fillStyle = "#D8EEFF";
  for (let tx = txMin; tx <= txMax; tx++) {
    for (let ty = tyMin; ty <= tyMax; ty++) {
      const seed = hashTile(tx, ty);
      const rng = mulberry32(seed);
      for (let i = 0; i < STARS_PER_TILE; i++) {
        const wx = (tx + rng()) * TILE_LY;
        const wy = (ty + rng()) * TILE_LY;
        const alpha = rng() * 0.5 + 0.25;
        const sizeRaw = rng();
        const px = gcx + wx * scale;
        const py = gcy + wy * scale;
        if (px < 0 || px > w || py < 0 || py > h) continue;
        const galR = Math.sqrt(wx * wx + wy * wy);
        const distFade = Math.max(0, Math.min(1, 1 - (galR - 30000) / 22000));
        if (distFade <= 0) continue;
        const size = largeStars
          ? sizeRaw < 0.65
            ? 1
            : sizeRaw < 0.9
              ? 1.5
              : 2
          : 1;
        ctx.globalAlpha = alpha * globalFade * distFade;
        ctx.fillRect(px, py, size, size);
      }
    }
  }
  ctx.globalAlpha = 1;
}

function drawLOD(
  ctx: CanvasRenderingContext2D,
  offscreen: HTMLCanvasElement,
  halfLY: number,
  gcx: number,
  gcy: number,
  scale: number,
  alpha: number,
): void {
  const gp = halfLY * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(offscreen, gcx - gp, gcy - gp, gp * 2, gp * 2);
}

export function drawGalaxyBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gcx: number,
  gcy: number,
  scale: number,
  zoom: number,
): void {
  ctx.fillStyle = "#020509";
  ctx.fillRect(0, 0, w, h);

  const isLocal = zoom > 8;
  const neighbourFade = zoom <= 0.5 ? 1 : isLocal ? 0 : 1 - (zoom - 0.5) / 7.5;

  const starFade = isLocal ? 1 : Math.max(0, Math.min(1, (zoom - 1) / 1.5));
  drawViewportStars(ctx, w, h, gcx, gcy, scale, isLocal, starFade);

  if (isLocal) {
    ctx.font = "11px Syne, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.textAlign = "center";
    ctx.fillText("You are viewing the Solar neighbourhood", w / 2, h - 32);
    return;
  }

  // barFade persists to zoom 4 so the bar stays visible when panning to the galactic centre
  const barFade = neighbourFade * Math.max(0, Math.min(1, 4 - zoom));
  const diskFade = neighbourFade * Math.max(0, Math.min(1, 2.5 - zoom));

  // Galactic disk — broad blue-violet background glow (drawn first, underneath everything)
  const diskR = 52000 * scale;
  if (diskR > 1 && diskFade > 0) {
    const disk = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, diskR);
    disk.addColorStop(0, `rgba(150,160,255,${(0.22 * diskFade).toFixed(3)})`);
    disk.addColorStop(0.3, `rgba(100,120,220,${(0.13 * diskFade).toFixed(3)})`);
    disk.addColorStop(0.65, `rgba(60,80,170,${(0.06 * diskFade).toFixed(3)})`);
    disk.addColorStop(1, "rgba(20,30,80,0)");
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(gcx, gcy, diskR, 0, TWO_PI);
    ctx.fill();
  }

  // Subtle dust lane — drawn before particles so particle cloud reads over it
  if (neighbourFade > 0) {
    ctx.strokeStyle = `rgba(0,0,0,${(0.07 * neighbourFade).toFixed(3)})`;
    ctx.lineWidth = Math.max(1, 1400 * scale);
    ctx.beginPath();
    ctx.arc(gcx, gcy, 8000 * scale, 0, TWO_PI);
    ctx.stroke();
  }

  // Arm guide lines — only screen-space linear transform per repaint, no trig
  const armPoints = getArmGuidePoints();
  ctx.lineWidth = 1;
  for (let ai = 0; ai < armGuideConfigs.length; ai++) {
    const { opacity } = armGuideConfigs[ai];
    const points = armPoints[ai];
    ctx.beginPath();
    const [wx0, wy0] = points[0];
    ctx.moveTo(gcx + wx0 * scale, gcy + wy0 * scale);
    for (let pi = 1; pi < points.length; pi++) {
      const [wx, wy] = points[pi];
      ctx.lineTo(gcx + wx * scale, gcy + wy * scale);
    }
    ctx.strokeStyle = `rgba(160,190,255,${(opacity * neighbourFade).toFixed(3)})`;
    ctx.stroke();
  }

  // LOD 0: full galaxy — fades out above zoom 2 as inner LODs take over
  const lod0Alpha = neighbourFade * Math.max(0, Math.min(1, 2 - zoom));
  if (lod0Alpha > 0)
    drawLOD(ctx, getLOD0Offscreen(), LOD0_HALF_LY, gcx, gcy, scale, lod0Alpha);

  // LOD 1: inner ±22 Kly — fades in at zoom 0.7, always crisp at this zoom range
  const lod1Alpha =
    neighbourFade * Math.max(0, Math.min(1, (zoom - 0.7) / 0.8));
  if (lod1Alpha > 0)
    drawLOD(ctx, getLOD1Offscreen(), LOD1_HALF_LY, gcx, gcy, scale, lod1Alpha);

  // LOD 2: core ±9 Kly — fades in at zoom 2.5, crisp 1px particles at zoom 3+
  const lod2Alpha = neighbourFade * Math.max(0, Math.min(1, (zoom - 2.5) / 1));
  if (lod2Alpha > 0)
    drawLOD(ctx, getLOD2Offscreen(), LOD2_HALF_LY, gcx, gcy, scale, lod2Alpha);

  ctx.globalAlpha = 1;

  // Galactic bar and nucleus drawn AFTER particle LODs so the bar shape is never hidden by
  // the circular particle distribution in the offscreen canvases
  if (barFade > 0) {
    // Long Bar: 45° CCW (SVG rotate(-45)), 6:1 aspect, dimmer than Galactic Bar
    const longBarSemiMajor = Math.max(5, 15000 * scale);
    ctx.save();
    ctx.translate(gcx, gcy);
    ctx.rotate(-LONG_BAR_ANGLE);
    ctx.scale(1, LONG_BAR_MINOR_RATIO);
    const longBar = ctx.createRadialGradient(0, 0, 0, 0, 0, longBarSemiMajor);
    longBar.addColorStop(0, `rgba(255,250,215,${(0.18 * barFade).toFixed(3)})`);
    longBar.addColorStop(
      0.3,
      `rgba(255,235,165,${(0.08 * barFade).toFixed(3)})`,
    );
    longBar.addColorStop(
      0.65,
      `rgba(235,195,100,${(0.03 * barFade).toFixed(3)})`,
    );
    longBar.addColorStop(1, "rgba(175,125,50,0)");
    ctx.fillStyle = longBar;
    ctx.beginPath();
    ctx.arc(0, 0, longBarSemiMajor, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // Galactic Bar: 55° CCW (SVG rotate(-55)), 2.5:1 aspect
    const barSemiMajor = Math.max(5, 12000 * scale);
    ctx.save();
    ctx.translate(gcx, gcy);
    ctx.rotate(-GALACTIC_BAR_ANGLE);
    ctx.scale(1, GALACTIC_BAR_MINOR_RATIO);
    const galBar = ctx.createRadialGradient(0, 0, 0, 0, 0, barSemiMajor);
    galBar.addColorStop(0, `rgba(255,250,215,${(0.3 * barFade).toFixed(3)})`);
    galBar.addColorStop(
      0.3,
      `rgba(255,235,165,${(0.14 * barFade).toFixed(3)})`,
    );
    galBar.addColorStop(
      0.65,
      `rgba(235,195,100,${(0.05 * barFade).toFixed(3)})`,
    );
    galBar.addColorStop(1, "rgba(175,125,50,0)");
    ctx.fillStyle = galBar;
    ctx.beginPath();
    ctx.arc(0, 0, barSemiMajor, 0, TWO_PI);
    ctx.fill();
    ctx.restore();

    // Compact bright nucleus centred on galactic centre (unscaled coordinates)
    const nucleusR = Math.max(3, 1800 * scale);
    const nucleus = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, nucleusR);
    nucleus.addColorStop(0, `rgba(255,255,235,${(0.98 * barFade).toFixed(3)})`);
    nucleus.addColorStop(
      0.3,
      `rgba(255,245,185,${(0.75 * barFade).toFixed(3)})`,
    );
    nucleus.addColorStop(
      0.7,
      `rgba(240,205,120,${(0.32 * barFade).toFixed(3)})`,
    );
    nucleus.addColorStop(1, "rgba(200,155,75,0)");
    ctx.fillStyle = nucleus;
    ctx.beginPath();
    ctx.arc(gcx, gcy, nucleusR, 0, TWO_PI);
    ctx.fill();
  }
}

function markerCanvasPos(
  worldX: number,
  worldY: number,
  cx: number,
  cy: number,
  panX: number,
  panY: number,
  scale: number,
): [number, number] {
  return [cx + panX + worldX * scale, cy + panY + worldY * scale];
}

const regionLabelCache = new Map<
  string,
  { upperName: string; w600: number; w700: number }
>();

function getRegionLabelMetrics(
  ctx: CanvasRenderingContext2D,
  region: GalaxyRegion,
): { upperName: string; w600: number; w700: number } {
  const cached = regionLabelCache.get(region.id);
  if (cached) return cached;
  const upperName = region.name.toUpperCase();
  ctx.font = "600 9px Syne, sans-serif";
  const w600 = ctx.measureText(upperName).width;
  ctx.font = "700 9px Syne, sans-serif";
  const w700 = ctx.measureText(upperName).width;
  const entry = { upperName, w600, w700 };
  regionLabelCache.set(region.id, entry);
  return entry;
}

export function drawRegionLabels(
  ctx: CanvasRenderingContext2D,
  regions: GalaxyRegion[],
  hoveredId: string | null,
  selectedId: string | null,
  cx: number,
  cy: number,
  panX: number,
  panY: number,
  scale: number,
  zoom: number,
): void {
  if (zoom > 6) return;
  const fade = zoom > 4 ? Math.max(0, 1 - (zoom - 4) / 2) : 1;
  if (fade <= 0) return;

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const region of regions) {
    const [sx, sy] = markerCanvasPos(
      region.labelX,
      region.labelY,
      cx,
      cy,
      panX,
      panY,
      scale,
    );
    const isHovered = region.id === hoveredId;
    const isSelected = region.id === selectedId;

    const { upperName, w600, w700 } = getRegionLabelMetrics(ctx, region);
    const tw = isSelected ? w700 : w600;
    ctx.font = `${isSelected ? "700" : "600"} 9px Syne, sans-serif`;
    const pH = 6;
    const pillW = tw + pH * 2;
    const pillH = 16;

    const baseAlpha = isHovered || isSelected ? 1 : 0.65;
    const a = fade * baseAlpha;

    ctx.globalAlpha = a * 0.65;
    ctx.fillStyle = "#020509";
    ctx.beginPath();
    ctx.roundRect(sx - pillW / 2, sy - pillH / 2, pillW, pillH, 3);
    ctx.fill();

    if (isSelected || isHovered) {
      ctx.globalAlpha = a * (isSelected ? 0.7 : 0.4);
      ctx.strokeStyle = region.color;
      ctx.lineWidth = isSelected ? 1.5 : 1;
      ctx.beginPath();
      ctx.roundRect(sx - pillW / 2, sy - pillH / 2, pillW, pillH, 3);
      ctx.stroke();
    }

    ctx.globalAlpha = a;
    ctx.fillStyle = isSelected || isHovered ? "#ffffff" : region.color;
    ctx.fillText(upperName, sx, sy + 1);
  }

  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
}

export function drawSystemMarkers(
  ctx: CanvasRenderingContext2D,
  markers: GalaxyMarker[],
  hoveredId: string | null,
  selectedId: string | null,
  cx: number,
  cy: number,
  panX: number,
  panY: number,
  scale: number,
  ts: number,
  zoom: number,
): void {
  const isLocal = zoom > 8;
  const isGalaxyScale = zoom <= 0.5;

  for (const m of markers) {
    const [mx, my] = markerCanvasPos(
      m.worldX,
      m.worldY,
      cx,
      cy,
      panX,
      panY,
      scale,
    );
    const isHovered = m.id === hoveredId;
    const isSelected = m.id === selectedId;
    const isSol = m.id === "sol";

    const baseR = isLocal
      ? isSol
        ? 7
        : 5
      : isGalaxyScale
        ? isSol
          ? 4
          : 2.5
        : isSol
          ? 5
          : 3.5;
    const r = baseR * (isHovered ? 1.4 : 1);

    if (isSelected) {
      const pulseScale = 1 + 0.3 * Math.sin(ts * 0.003);
      const glowR = r * 3.5 * pulseScale;
      const glow = ctx.createRadialGradient(mx, my, r, mx, my, glowR);
      glow.addColorStop(0, m.starColor + "55");
      glow.addColorStop(1, m.starColor + "00");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, glowR, 0, TWO_PI);
      ctx.fill();
    } else if (isHovered) {
      const glowR = r * 2.8;
      const glow = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, glowR);
      glow.addColorStop(0, m.starColor + "40");
      glow.addColorStop(1, m.starColor + "00");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, glowR, 0, TWO_PI);
      ctx.fill();
    }

    const bitmap = getMarkerBitmap(m.rootType, m.starColor);
    const drawHalf = (MARKER_SIZE / 2) * (r / MARKER_BASE_R);
    ctx.drawImage(
      bitmap,
      mx - drawHalf,
      my - drawHalf,
      drawHalf * 2,
      drawHalf * 2,
    );

    if (isSelected) {
      ctx.strokeStyle = m.starColor + "CC";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, r + 3, 0, TWO_PI);
      ctx.stroke();
    }

    const showLabel = isSol || isHovered || isSelected;
    if (!showLabel) continue;

    if (
      isLocal &&
      m.distanceFromEarth !== undefined &&
      m.distanceFromEarth > 0
    ) {
      ctx.font = `${isSelected ? 600 : 400} ${isSelected ? 12 : 11}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,215,240,0.9)";
      ctx.textAlign = "center";
      ctx.fillText(m.name, mx, my - r - 18);
      ctx.font = "400 10px Syne, sans-serif";
      ctx.fillStyle = "rgba(160,190,230,0.75)";
      ctx.fillText(`${m.distanceFromEarth.toFixed(1)} ly`, mx, my - r - 6);
    } else {
      ctx.font = `${isSelected ? 600 : 400} ${isSelected ? 12 : 11}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,215,240,0.9)";
      ctx.textAlign = "center";
      ctx.fillText(m.name, mx, my - r - 6);
    }
  }
}
