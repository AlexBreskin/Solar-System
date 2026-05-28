import { mulberry32 } from "../../utils/mulberry32";
import type { CelestialBody, VisualConfig } from "../../types";

const TWO_PI = Math.PI * 2;

interface BeltParticle {
  angle: number;
  radius: number;
  size: number;
  opacity: number;
}

const beltParticleCache = new Map<string, BeltParticle[]>();

function getBeltParticles(
  beltId: string,
  visualConfig: VisualConfig,
): BeltParticle[] {
  if (beltParticleCache.has(beltId)) return beltParticleCache.get(beltId)!;
  const config = visualConfig.beltConfigs[beltId];
  if (!config) return [];
  const { innerRadius, outerRadius, particleCount, seed } = config;
  const rng = mulberry32(seed);
  const particles: BeltParticle[] = Array.from(
    { length: particleCount },
    (): BeltParticle => ({
      angle: rng() * TWO_PI,
      radius: innerRadius + rng() * (outerRadius - innerRadius),
      size: rng() * 1.2 + 0.4,
      opacity: rng() * 0.4 + 0.15,
    }),
  );
  beltParticleCache.set(beltId, particles);
  return particles;
}

function drawBeltHighlight(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  midRadius: number,
  ringWidth: number,
  body: CelestialBody,
  color: string,
  isSelected: boolean,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, midRadius, 0, TWO_PI);
  ctx.strokeStyle = isSelected
    ? (body.glowColor ?? color) + "60"
    : (body.glowColor ?? color) + "30";
  ctx.lineWidth = ringWidth;
  ctx.stroke();
}

function drawBeltParticles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  beltId: string,
  color: string,
  isSelected: boolean,
  isHovered: boolean,
  visualConfig: VisualConfig,
): void {
  ctx.fillStyle = color;
  for (const { angle, radius, size, opacity } of getBeltParticles(
    beltId,
    visualConfig,
  )) {
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    ctx.globalAlpha =
      isSelected || isHovered ? Math.min(1, opacity * 1.8) : opacity;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, TWO_PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBeltLabel(
  ctx: CanvasRenderingContext2D,
  body: CelestialBody,
  cx: number,
  cy: number,
  outerRadius: number,
  isSelected: boolean,
  isHovered: boolean,
  showLabels: boolean,
): void {
  if (!showLabels && !isSelected && !isHovered) return;
  ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
  ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,210,230,0.7)";
  ctx.textAlign = "left";
  ctx.fillText(body.name, cx + outerRadius + 6, cy + 4);
  ctx.textAlign = "center";
}

export function drawBelt(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  beltId: string,
  isSelected: boolean,
  isHovered: boolean,
  showLabels: boolean,
  zoom: number,
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
): void {
  const config = visualConfig.beltConfigs[beltId];
  const body = bodies[beltId];
  if (!config || !body) return;

  const { innerRadius, outerRadius, color } = config;
  const midRadius = (innerRadius + outerRadius) / 2;
  const ringWidth = outerRadius - innerRadius;

  if (isSelected || isHovered) {
    drawBeltHighlight(
      ctx,
      cx,
      cy,
      midRadius,
      ringWidth,
      body,
      color,
      isSelected,
    );
  }

  if (zoom < 0.7) {
    // Below this threshold most particles are sub-pixel — draw a single ring instead
    ctx.beginPath();
    ctx.arc(cx, cy, midRadius, 0, TWO_PI);
    ctx.strokeStyle = color + "48";
    ctx.lineWidth = ringWidth;
    ctx.stroke();
  } else {
    drawBeltParticles(
      ctx,
      cx,
      cy,
      beltId,
      color,
      isSelected,
      isHovered,
      visualConfig,
    );
  }

  drawBeltLabel(
    ctx,
    body,
    cx,
    cy,
    outerRadius,
    isSelected,
    isHovered,
    showLabels,
  );
}
