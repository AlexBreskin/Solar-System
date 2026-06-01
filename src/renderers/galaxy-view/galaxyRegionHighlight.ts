import type { GalaxyRegion, SpiralBandShape, EllipseShape } from "../../types";
import {
  spiralWorldPoint,
  GALACTIC_CENTRE_WORLD_Y,
} from "../../utils/spiralGeometry";

const FILL_ALPHA = 0.22;
const STROKE_ALPHA = 0.5;
const STROKE_WIDTH_PX = 2;

function worldToCanvas(
  wx: number,
  wy: number,
  gcx: number,
  gcy: number,
  scale: number,
): [number, number] {
  return [gcx + wx * scale, gcy + (wy - GALACTIC_CENTRE_WORLD_Y) * scale];
}

function buildSpiralPath(
  shape: SpiralBandShape,
  gcx: number,
  gcy: number,
  scale: number,
): Path2D {
  const STEPS = 200;
  const path = new Path2D();
  for (let i = 0; i <= STEPS; i++) {
    const t = shape.tStart + (i / STEPS) * (shape.tEnd - shape.tStart);
    const [wx, wy] = spiralWorldPoint(t, shape.armOffset);
    const [cx, cy] = worldToCanvas(wx, wy, gcx, gcy, scale);
    if (i === 0) path.moveTo(cx, cy);
    else path.lineTo(cx, cy);
  }
  return path;
}

function drawSpiralBandHighlight(
  ctx: CanvasRenderingContext2D,
  shape: SpiralBandShape,
  color: string,
  gcx: number,
  gcy: number,
  scale: number,
  fade: number,
): void {
  const bandPx = shape.halfWidth * 2 * scale;
  if (bandPx < 1) return;

  const path = buildSpiralPath(shape, gcx, gcy, scale);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;

  ctx.lineWidth = bandPx;
  ctx.globalAlpha = FILL_ALPHA * fade;
  ctx.stroke(path);

  ctx.lineWidth = STROKE_WIDTH_PX;
  ctx.globalAlpha = STROKE_ALPHA * fade;
  ctx.stroke(path);

  ctx.restore();
}

function drawEllipseHighlight(
  ctx: CanvasRenderingContext2D,
  shape: EllipseShape,
  color: string,
  gcx: number,
  gcy: number,
  scale: number,
  fade: number,
): void {
  const [cx, cy] = worldToCanvas(shape.cx, shape.cy, gcx, gcy, scale);
  const rxPx = shape.rx * scale;
  const ryPx = shape.ry * scale;
  if (rxPx < 1 || ryPx < 1) return;

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rxPx, ryPx, -shape.angleRad, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.globalAlpha = FILL_ALPHA * fade;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = STROKE_WIDTH_PX;
  ctx.globalAlpha = STROKE_ALPHA * fade;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws a semi-transparent coloured overlay for the selected region's shape
 * on the top canvas. Must be called after clearRect and before markers.
 * Does nothing if the region has no shape (halo) or zoom > 6.
 */
export function drawRegionHighlight(
  ctx: CanvasRenderingContext2D,
  region: GalaxyRegion,
  gcx: number,
  gcy: number,
  scale: number,
  zoom: number,
): void {
  if (!region.shape || zoom > 6) return;
  const fade = zoom > 4 ? Math.max(0, 1 - (zoom - 4) / 2) : 1;
  if (fade <= 0) return;

  if (region.shape.type === "spiralBand") {
    drawSpiralBandHighlight(
      ctx,
      region.shape,
      region.color,
      gcx,
      gcy,
      scale,
      fade,
    );
  } else {
    drawEllipseHighlight(
      ctx,
      region.shape,
      region.color,
      gcx,
      gcy,
      scale,
      fade,
    );
  }
}
