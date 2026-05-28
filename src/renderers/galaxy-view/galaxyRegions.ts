import type { GalaxyRegion } from "../../types";

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

function drawSingleRegionLabel(
  ctx: CanvasRenderingContext2D,
  region: GalaxyRegion,
  sx: number,
  sy: number,
  isHovered: boolean,
  isSelected: boolean,
  a: number,
): void {
  const { upperName, w600, w700 } = getRegionLabelMetrics(ctx, region);
  const tw = isSelected ? w700 : w600;
  ctx.font = `${isSelected ? "700" : "600"} 9px Syne, sans-serif`;
  const pillW = tw + 12;
  const pillH = 16;

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
    const sx = cx + panX + region.labelX * scale;
    const sy = cy + panY + region.labelY * scale;
    const isHovered = region.id === hoveredId;
    const isSelected = region.id === selectedId;
    const baseAlpha = isHovered || isSelected ? 1 : 0.65;
    drawSingleRegionLabel(
      ctx,
      region,
      sx,
      sy,
      isHovered,
      isSelected,
      fade * baseAlpha,
    );
  }

  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";
}
