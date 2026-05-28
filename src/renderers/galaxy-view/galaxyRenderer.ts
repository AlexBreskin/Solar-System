import { mulberry32 } from "../../utils/mulberry32";
import {
  getLOD0Offscreen,
  getLOD1Offscreen,
  getLOD2Offscreen,
  LOD0_HALF_LY,
  LOD1_HALF_LY,
  LOD2_HALF_LY,
} from "./galaxyParticles";

const TWO_PI = Math.PI * 2;

// Bar geometry — angles match SVG reference (rotate(-55) for Galactic Bar, rotate(-45) for Long Bar).
// Negative rotation = CCW in canvas = upper-right → lower-left orientation on screen.
const GALACTIC_BAR_ANGLE = (Math.PI * 55) / 180;
const GALACTIC_BAR_MINOR_RATIO = 0.4; // ry/rx = 40/100 from SVG, 2.5:1 aspect

const LONG_BAR_ANGLE = Math.PI / 4;
const LONG_BAR_MINOR_RATIO = 1 / 6; // ry/rx = 20/120 from SVG, 6:1 aspect

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

function hashTile(tx: number, ty: number): number {
  const a = (Math.imul(tx, 0x6d2b79f5) ^ Math.imul(ty, 0x4a0d6e3f)) | 0;
  return ((a ^ (a >>> 15)) * 0x735a2d97) >>> 0;
}

function isOnScreen(px: number, py: number, w: number, h: number): boolean {
  return px >= 0 && px <= w && py >= 0 && py <= h;
}

function starPixelSize(largeStars: boolean, sizeRaw: number): number {
  if (!largeStars) return 1;
  if (sizeRaw < 0.65) return 1;
  if (sizeRaw < 0.9) return 1.5;
  return 2;
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
        if (!isOnScreen(px, py, w, h)) continue;
        const galR = Math.sqrt(wx * wx + wy * wy);
        const distFade = Math.max(0, Math.min(1, 1 - (galR - 30000) / 22000));
        if (distFade <= 0) continue;
        ctx.globalAlpha = alpha * globalFade * distFade;
        const sz = starPixelSize(largeStars, sizeRaw);
        ctx.fillRect(px, py, sz, sz);
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

function computeNeighbourFade(zoom: number, isLocal: boolean): number {
  if (zoom <= 0.5) return 1;
  if (isLocal) return 0;
  return 1 - (zoom - 0.5) / 7.5;
}

function drawArmGuides(
  ctx: CanvasRenderingContext2D,
  gcx: number,
  gcy: number,
  scale: number,
  neighbourFade: number,
): void {
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
}

function drawBarEllipse(
  ctx: CanvasRenderingContext2D,
  gcx: number,
  gcy: number,
  scale: number,
  barFade: number,
  angle: number,
  minorRatio: number,
  semiMajorLY: number,
  opacities: [number, number, number],
): void {
  const semiMajor = Math.max(5, semiMajorLY * scale);
  ctx.save();
  ctx.translate(gcx, gcy);
  ctx.rotate(-angle);
  ctx.scale(1, minorRatio);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, semiMajor);
  g.addColorStop(0, `rgba(255,250,215,${(opacities[0] * barFade).toFixed(3)})`);
  g.addColorStop(
    0.3,
    `rgba(255,235,165,${(opacities[1] * barFade).toFixed(3)})`,
  );
  g.addColorStop(
    0.65,
    `rgba(235,195,100,${(opacities[2] * barFade).toFixed(3)})`,
  );
  g.addColorStop(1, "rgba(175,125,50,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, semiMajor, 0, TWO_PI);
  ctx.fill();
  ctx.restore();
}

function drawGalacticBar(
  ctx: CanvasRenderingContext2D,
  gcx: number,
  gcy: number,
  scale: number,
  barFade: number,
): void {
  drawBarEllipse(
    ctx,
    gcx,
    gcy,
    scale,
    barFade,
    LONG_BAR_ANGLE,
    LONG_BAR_MINOR_RATIO,
    15000,
    [0.18, 0.08, 0.03],
  );
  drawBarEllipse(
    ctx,
    gcx,
    gcy,
    scale,
    barFade,
    GALACTIC_BAR_ANGLE,
    GALACTIC_BAR_MINOR_RATIO,
    12000,
    [0.3, 0.14, 0.05],
  );

  const nucleusR = Math.max(3, 1800 * scale);
  const nucleus = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, nucleusR);
  nucleus.addColorStop(0, `rgba(255,255,235,${(0.98 * barFade).toFixed(3)})`);
  nucleus.addColorStop(0.3, `rgba(255,245,185,${(0.75 * barFade).toFixed(3)})`);
  nucleus.addColorStop(0.7, `rgba(240,205,120,${(0.32 * barFade).toFixed(3)})`);
  nucleus.addColorStop(1, "rgba(200,155,75,0)");
  ctx.fillStyle = nucleus;
  ctx.beginPath();
  ctx.arc(gcx, gcy, nucleusR, 0, TWO_PI);
  ctx.fill();
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
  const neighbourFade = computeNeighbourFade(zoom, isLocal);

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

  drawArmGuides(ctx, gcx, gcy, scale, neighbourFade);

  const lod0Alpha = neighbourFade * Math.max(0, Math.min(1, 2 - zoom));
  if (lod0Alpha > 0)
    drawLOD(ctx, getLOD0Offscreen(), LOD0_HALF_LY, gcx, gcy, scale, lod0Alpha);

  const lod1Alpha =
    neighbourFade * Math.max(0, Math.min(1, (zoom - 0.7) / 0.8));
  if (lod1Alpha > 0)
    drawLOD(ctx, getLOD1Offscreen(), LOD1_HALF_LY, gcx, gcy, scale, lod1Alpha);

  const lod2Alpha = neighbourFade * Math.max(0, Math.min(1, (zoom - 2.5) / 1));
  if (lod2Alpha > 0)
    drawLOD(ctx, getLOD2Offscreen(), LOD2_HALF_LY, gcx, gcy, scale, lod2Alpha);

  ctx.globalAlpha = 1;

  // Galactic bar and nucleus drawn AFTER particle LODs so the bar shape is never hidden by
  // the circular particle distribution in the offscreen canvases
  if (barFade > 0) drawGalacticBar(ctx, gcx, gcy, scale, barFade);
}
