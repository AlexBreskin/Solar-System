import { mulberry32 } from "../../utils/mulberry32";
import type { CelestialBody, Vec2, VisualConfig } from "../../types";

const TWO_PI = Math.PI * 2;

type StarTuple = [number, number, number, number];

let cachedStars: StarTuple[] | null = null;
function getStarField(): StarTuple[] {
  if (cachedStars) return cachedStars;
  const rng = mulberry32(12345);
  cachedStars = Array.from(
    { length: 300 },
    (): StarTuple => [
      rng() * 2000,
      rng() * 1200,
      rng() * 1.2 + 0.3,
      rng() * 0.6 + 0.2,
    ],
  );
  return cachedStars;
}

export function drawStarField(ctx: CanvasRenderingContext2D): void {
  // Batch into 4 alpha buckets: 300 fill calls → 4
  const buckets: StarTuple[][] = [[], [], [], []];
  for (const star of getStarField()) {
    buckets[Math.min(3, Math.floor((star[3] - 0.2) / 0.16))]?.push(star);
  }
  const alphas = [0.25, 0.41, 0.57, 0.72];
  ctx.fillStyle = "#ffffff";
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

export function drawOrbits(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  selectedBody: string,
  hoveredBody: string | null,
  showOrbits: boolean,
  bodies: Record<string, CelestialBody>,
  visualConfig: VisualConfig,
  positions: Record<string, Vec2>,
): void {
  const { orbitalRadii, moonOrbitalRadii } = visualConfig;
  const allOrbitalRadii = { ...moonOrbitalRadii, ...orbitalRadii };
  for (const [id, body] of Object.entries(bodies)) {
    if (!body.showOrbitRing) continue;
    const isHighlighted = id === selectedBody || id === hoveredBody;
    if (!showOrbits && !isHighlighted) continue;
    const parentPos =
      body.parent && positions[body.parent]
        ? positions[body.parent]
        : { x: cx, y: cy };
    const radius = allOrbitalRadii[id] ?? 0;
    ctx.beginPath();
    ctx.arc(parentPos.x, parentPos.y, radius, 0, TWO_PI);
    if (isHighlighted) {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
    } else {
      ctx.strokeStyle = "rgba(255,255,255,0.30)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 8]);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

export function drawBodyRings(
  ctx: CanvasRenderingContext2D,
  positions: Record<string, Vec2>,
  pass: "back" | "front",
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
      const midR = (inner + outer) / 2;
      ctx.globalAlpha = band.intensity;
      ctx.beginPath();
      ctx.ellipse(
        0,
        0,
        midR,
        midR * 0.38,
        0,
        pass === "back" ? Math.PI : 0,
        pass === "back" ? TWO_PI : Math.PI,
      );
      ctx.strokeStyle = band.color;
      ctx.lineWidth = outer - inner;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
