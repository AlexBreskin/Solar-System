import { lighten } from "../../utils/color";
import { BodyType } from "../../types";
import type { CelestialBody, Vec2, VisualConfig } from "../../types";

const TWO_PI = Math.PI * 2;

export function drawSun(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  active: boolean,
): void {
  const corona = ctx.createRadialGradient(x, y, r, x, y, r * 3.5);
  corona.addColorStop(0, "rgba(255,160,0,0.3)");
  corona.addColorStop(1, "rgba(255,80,0,0)");
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, TWO_PI);
  ctx.fill();

  const grad = ctx.createRadialGradient(
    x - r * 0.3,
    y - r * 0.3,
    r * 0.1,
    x,
    y,
    r,
  );
  grad.addColorStop(0, "#FFF5AA");
  grad.addColorStop(0.4, "#FDB813");
  grad.addColorStop(1, "#E07B00");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();
  if (active) {
    ctx.strokeStyle = "rgba(255,200,80,0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

export function drawBlackHole(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  glowColor: string,
  active: boolean,
): void {
  const diskOuter = r * 3;
  const disk = ctx.createRadialGradient(x, y, r, x, y, diskOuter);
  disk.addColorStop(0, glowColor + "CC");
  disk.addColorStop(0.4, glowColor + "60");
  disk.addColorStop(1, glowColor + "00");
  ctx.fillStyle = disk;
  ctx.beginPath();
  ctx.arc(x, y, diskOuter, 0, TWO_PI);
  ctx.fill();

  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TWO_PI);
  ctx.fill();

  if (active) {
    ctx.strokeStyle = glowColor + "CC";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawBodyGlows(
  ctx: CanvasRenderingContext2D,
  bodies: Record<string, CelestialBody>,
  positions: Record<string, Vec2>,
  selectedBody: string,
  hoveredBody: string | null,
  planetSizes: Record<string, number>,
): void {
  for (const [id, body] of Object.entries(bodies)) {
    if (body.type === BodyType.Belt) continue;
    const pos = positions[id];
    if (!pos) continue;
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;
    if (isSelected || isHovered) {
      const glowR = r + (isSelected ? 10 : 6);
      const grad = ctx.createRadialGradient(
        pos.x,
        pos.y,
        r * 0.5,
        pos.x,
        pos.y,
        glowR * 2,
      );
      grad.addColorStop(0, (body.glowColor ?? body.color) + "60");
      grad.addColorStop(1, (body.glowColor ?? body.color) + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, glowR * 2, 0, TWO_PI);
      ctx.fill();
    }
  }
}

function drawMoonOrbitRings(
  ctx: CanvasRenderingContext2D,
  bodies: Record<string, CelestialBody>,
  positions: Record<string, Vec2>,
  moonOrbitalRadii: Record<string, number>,
  showOrbits: boolean,
): void {
  if (!showOrbits) return;
  for (const [id, body] of Object.entries(bodies)) {
    if (body.type !== BodyType.Moon && body.type !== BodyType.Companion)
      continue;
    const parent = body.parent;
    if (!parent) continue;
    const { x: px, y: py } = positions[parent] ?? { x: 0, y: 0 };
    ctx.beginPath();
    ctx.arc(px, py, moonOrbitalRadii[id] ?? 0, 0, TWO_PI);
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

function drawGenericBody(
  ctx: CanvasRenderingContext2D,
  body: CelestialBody,
  pos: Vec2,
  r: number,
  isSelected: boolean,
  isHovered: boolean,
): void {
  const grad = ctx.createRadialGradient(
    pos.x - r * 0.3,
    pos.y - r * 0.3,
    r * 0.1,
    pos.x,
    pos.y,
    r,
  );
  grad.addColorStop(0, lighten(body.color, 40));
  grad.addColorStop(1, body.color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
  ctx.fill();

  if (isSelected) {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 0.5;
    ctx.setLineDash([3, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (isHovered) {
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
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

function drawBodyLabel(
  ctx: CanvasRenderingContext2D,
  body: CelestialBody,
  pos: Vec2,
  r: number,
  isSelected: boolean,
  isHovered: boolean,
  showLabels: boolean,
): void {
  if (!showLabels && !isSelected && !isHovered) return;
  ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
  ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,210,230,0.7)";
  ctx.textAlign = "center";
  const labelOffset = body.rings?.length ? r + 14 : r + 5;
  ctx.fillText(body.name, pos.x, pos.y - labelOffset);
}

function drawBodyShapes(
  ctx: CanvasRenderingContext2D,
  bodies: Record<string, CelestialBody>,
  positions: Record<string, Vec2>,
  selectedBody: string,
  hoveredBody: string | null,
  showLabels: boolean,
  planetSizes: Record<string, number>,
): void {
  for (const [id, body] of Object.entries(bodies)) {
    if (body.type === BodyType.Belt) continue;
    const pos = positions[id];
    if (!pos) continue;
    const r = planetSizes[id] ?? 4;
    const isSelected = id === selectedBody;
    const isHovered = id === hoveredBody;
    const active = isSelected || isHovered;

    if (body.type === BodyType.Star) {
      drawSun(ctx, pos.x, pos.y, r, active);
    } else if (body.type === BodyType.BlackHole) {
      drawBlackHole(ctx, pos.x, pos.y, r, body.glowColor ?? "#FF8800", active);
    } else {
      drawGenericBody(ctx, body, pos, r, isSelected, isHovered);
    }

    drawBodyLabel(ctx, body, pos, r, isSelected, isHovered, showLabels);
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
  drawBodyGlows(ctx, bodies, positions, selectedBody, hoveredBody, planetSizes);
  drawMoonOrbitRings(ctx, bodies, positions, moonOrbitalRadii, showOrbits);
  drawBodyShapes(
    ctx,
    bodies,
    positions,
    selectedBody,
    hoveredBody,
    showLabels,
    planetSizes,
  );
}
