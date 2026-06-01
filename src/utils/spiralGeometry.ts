import type { SpiralBandShape, EllipseShape, RegionShape } from "../types";

// Spiral constants matching galaxyRenderer.ts arm guides
export const SPIRAL_A = 2000;
export const SPIRAL_B = 0.22;
export const SPIRAL_T_START = 0.4;
export const SPIRAL_T_END = Math.log(52000 / SPIRAL_A) / SPIRAL_B; // ≈ 14.8
export const GALACTIC_CENTRE_WORLD_Y = -26000;

const GOLDEN_RATIO_CONJUGATE = 0.6180339887498949; // (√5 − 1) / 2
// Coarse steps used to locate the global minimum before refinement.
// The spiral winds ~2.3× over its full t range; 60 steps gives sub-radian
// resolution and reliably identifies which winding is closest.
const COARSE_STEPS = 60;

// Cache cos/sin of ellipse rotation angles — these are constants per region.
const ellipseAngleCache = new Map<number, { c: number; s: number }>();

function getEllipseAngleTrig(angleRad: number): { c: number; s: number } {
  const cached = ellipseAngleCache.get(angleRad);
  if (cached) return cached;
  const entry = { c: Math.cos(-angleRad), s: Math.sin(-angleRad) };
  ellipseAngleCache.set(angleRad, entry);
  return entry;
}

/**
 * Returns world-coordinate (Sol-centric) point on the logarithmic spiral
 * r = SPIRAL_A * exp(SPIRAL_B * t), theta = t + armOffset.
 */
export function spiralWorldPoint(
  t: number,
  armOffset: number,
): [number, number] {
  const r = SPIRAL_A * Math.exp(SPIRAL_B * t);
  const theta = t + armOffset;
  return [r * Math.cos(theta), -r * Math.sin(theta) + GALACTIC_CENTRE_WORLD_Y];
}

function squaredDistToSpiral(
  t: number,
  armOffset: number,
  px: number,
  py: number,
): number {
  const [sx, sy] = spiralWorldPoint(t, armOffset);
  return (sx - px) ** 2 + (sy - py) ** 2;
}

function goldenSectionRefine(
  px: number,
  py: number,
  armOffset: number,
  a: number,
  b: number,
): number {
  // 1e-5 keeps arc-length error well under 1 ly even at the outermost spiral.
  const TOLERANCE = 1e-5;
  let lo = a;
  let hi = b;
  let c = hi - GOLDEN_RATIO_CONJUGATE * (hi - lo);
  let d = lo + GOLDEN_RATIO_CONJUGATE * (hi - lo);
  // Cache both evaluations; carry one forward each iteration (halves trig work).
  let fc = squaredDistToSpiral(c, armOffset, px, py);
  let fd = squaredDistToSpiral(d, armOffset, px, py);
  while (hi - lo > TOLERANCE) {
    if (fc < fd) {
      hi = d;
      d = c;
      fd = fc;
      c = hi - GOLDEN_RATIO_CONJUGATE * (hi - lo);
      fc = squaredDistToSpiral(c, armOffset, px, py);
    } else {
      lo = c;
      c = d;
      fc = fd;
      d = lo + GOLDEN_RATIO_CONJUGATE * (hi - lo);
      fd = squaredDistToSpiral(d, armOffset, px, py);
    }
  }
  return (lo + hi) / 2;
}

/**
 * Returns the t value on the spiral nearest to world point (px, py).
 * Coarse sampling locates the global minimum; golden-section search refines it.
 * This handles multi-winding spirals where pure golden-section search would
 * converge to the wrong local minimum.
 */
export function nearestSpiralT(
  px: number,
  py: number,
  armOffset: number,
  tStart: number,
  tEnd: number,
): number {
  const step = (tEnd - tStart) / COARSE_STEPS;
  let bestT = tStart;
  let bestD2 = squaredDistToSpiral(tStart, armOffset, px, py);
  for (let i = 1; i <= COARSE_STEPS; i++) {
    const t = tStart + i * step;
    const d2 = squaredDistToSpiral(t, armOffset, px, py);
    if (d2 < bestD2) {
      bestD2 = d2;
      bestT = t;
    }
  }
  return goldenSectionRefine(
    px,
    py,
    armOffset,
    Math.max(tStart, bestT - step),
    Math.min(tEnd, bestT + step),
  );
}

/** Euclidean distance from world point (px, py) to the nearest spiral centreline point. */
export function distanceToSpiral(
  px: number,
  py: number,
  armOffset: number,
  tStart: number,
  tEnd: number,
): number {
  const t = nearestSpiralT(px, py, armOffset, tStart, tEnd);
  const [sx, sy] = spiralWorldPoint(t, armOffset);
  return Math.hypot(sx - px, sy - py);
}

/**
 * Signed distance from world point (px, py) to the shape boundary.
 * Negative  →  inside.  Zero  →  on boundary.  Positive  →  outside (ly).
 * Ellipse distances are scaled by the geometric mean of the semi-axes to give
 * approximate light-year units comparable to spiral-band distances.
 */
export function signedDistToShape(
  px: number,
  py: number,
  shape: RegionShape,
): number {
  if (shape.type === "spiralBand") {
    return (
      distanceToSpiral(px, py, shape.armOffset, shape.tStart, shape.tEnd) -
      shape.halfWidth
    );
  }
  const dx = px - shape.cx;
  const dy = py - shape.cy;
  const { c, s } = getEllipseAngleTrig(shape.angleRad);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  const norm = Math.sqrt((lx / shape.rx) ** 2 + (ly / shape.ry) ** 2);
  return (norm - 1) * Math.sqrt(shape.rx * shape.ry);
}

/** True when (px, py) lies within halfWidth light-years of the spiral band centreline. */
export function pointInSpiralBand(
  px: number,
  py: number,
  shape: SpiralBandShape,
): boolean {
  return (
    distanceToSpiral(px, py, shape.armOffset, shape.tStart, shape.tEnd) <=
    shape.halfWidth
  );
}

/** True when (px, py) lies within the (possibly rotated) ellipse. */
export function pointInEllipse(
  px: number,
  py: number,
  shape: EllipseShape,
): boolean {
  const dx = px - shape.cx;
  const dy = py - shape.cy;
  const { c, s } = getEllipseAngleTrig(shape.angleRad);
  const lx = dx * c - dy * s;
  const ly = dx * s + dy * c;
  return (lx / shape.rx) ** 2 + (ly / shape.ry) ** 2 <= 1;
}

/** Dispatches to the correct containment check for the given shape type. */
export function pointInRegionShape(
  px: number,
  py: number,
  shape: RegionShape,
): boolean {
  if (shape.type === "spiralBand") return pointInSpiralBand(px, py, shape);
  return pointInEllipse(px, py, shape);
}
