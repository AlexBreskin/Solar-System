import type { GalaxyMarker } from "../../simulation/galaxySimulation";

const TWO_PI = Math.PI * 2;

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

function markerRadius(
  isLocal: boolean,
  isGalaxyScale: boolean,
  isSol: boolean,
): number {
  if (isLocal) return isSol ? 7 : 5;
  if (isGalaxyScale) return isSol ? 4 : 2.5;
  return isSol ? 5 : 3.5;
}

function drawMarkerGlow(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  r: number,
  m: GalaxyMarker,
  ts: number,
  isSelected: boolean,
  isHovered: boolean,
): void {
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
}

function drawMarkerLabel(
  ctx: CanvasRenderingContext2D,
  m: GalaxyMarker,
  mx: number,
  my: number,
  r: number,
  isLocal: boolean,
  isSelected: boolean,
): void {
  const weight = isSelected ? 600 : 400;
  const size = isSelected ? 12 : 11;
  ctx.font = `${weight} ${size}px Syne, sans-serif`;
  ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,215,240,0.9)";
  ctx.textAlign = "center";
  if (isLocal && m.distanceFromEarth !== undefined && m.distanceFromEarth > 0) {
    ctx.fillText(m.name, mx, my - r - 18);
    ctx.font = "400 10px Syne, sans-serif";
    ctx.fillStyle = "rgba(160,190,230,0.75)";
    ctx.fillText(`${m.distanceFromEarth.toFixed(1)} ly`, mx, my - r - 6);
  } else {
    ctx.fillText(m.name, mx, my - r - 6);
  }
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
  constellationIds?: Set<string>,
): void {
  const isLocal = zoom > 8;
  const isGalaxyScale = zoom <= 0.5;

  for (const m of markers) {
    const mx = cx + panX + m.worldX * scale;
    const my = cy + panY + m.worldY * scale;
    const isHovered = m.id === hoveredId;
    const isSelected = m.id === selectedId;
    const isSol = m.id === "sol";

    const baseR = markerRadius(isLocal, isGalaxyScale, isSol);
    const r = baseR * (isHovered ? 1.4 : 1);

    if (constellationIds?.has(m.id)) {
      ctx.beginPath();
      ctx.arc(mx, my, r + 5, 0, TWO_PI);
      ctx.strokeStyle = m.starColor + "55";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    drawMarkerGlow(ctx, mx, my, r, m, ts, isSelected, isHovered);

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

    if (!isSol && !isHovered && !isSelected) continue;
    drawMarkerLabel(ctx, m, mx, my, r, isLocal, isSelected);
  }
}
