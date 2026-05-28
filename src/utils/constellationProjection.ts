import type { ConstellationStar } from "@/types/galaxy";

export interface ConstellationProjection {
  project(ra: number, dec: number): { x: number; y: number };
}

const DEG = Math.PI / 180;

function gnomonic(
  ra: number,
  dec: number,
  ra0: number,
  sinD0: number,
  cosD0: number,
): { px: number; py: number } {
  const dRA = ra * DEG - ra0;
  const d = dec * DEG;
  const cosC = sinD0 * Math.sin(d) + cosD0 * Math.cos(d) * Math.cos(dRA);
  return {
    px: (Math.cos(d) * Math.sin(dRA)) / cosC,
    py: (cosD0 * Math.sin(d) - sinD0 * Math.cos(d) * Math.cos(dRA)) / cosC,
  };
}

export function buildProjection(
  lines: number[][][],
  stars: ConstellationStar[] = [],
): ConstellationProjection {
  const pts = lines.flat(1) as [number, number][];
  if (pts.length === 0) return { project: () => ({ x: 50, y: 50 }) };

  // Centroid from line points only — keeps it on the asterism, not pulled
  // toward off-asterism system-marker stars like Sgr A*.
  let sumX = 0;
  let sumY = 0;
  let sumZ = 0;
  for (const [ra, dec] of pts) {
    const r = ra * DEG;
    const d = dec * DEG;
    sumX += Math.cos(d) * Math.cos(r);
    sumY += Math.cos(d) * Math.sin(r);
    sumZ += Math.sin(d);
  }
  const ra0 = Math.atan2(sumY, sumX);
  const dec0 = Math.atan2(sumZ, Math.sqrt(sumX * sumX + sumY * sumY));
  const sinD0 = Math.sin(dec0);
  const cosD0 = Math.cos(dec0);

  // Bounds from lines + stars so system-marker dots stay within the viewport.
  const allPts: [number, number][] = [
    ...pts,
    ...stars.map((s): [number, number] => [s.ra, s.dec]),
  ];
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const [ra, dec] of allPts) {
    const { px, py } = gnomonic(ra, dec, ra0, sinD0, cosD0);
    if (px < xMin) xMin = px;
    if (px > xMax) xMax = px;
    if (py < yMin) yMin = py;
    if (py > yMax) yMax = py;
  }

  const xPad = Math.max((xMax - xMin) * 0.12, 0.02);
  const yPad = Math.max((yMax - yMin) * 0.12, 0.02);
  xMin -= xPad;
  xMax += xPad;
  yMin -= yPad;
  yMax += yPad;

  const xCentre = (xMin + xMax) / 2;
  const yCentre = (yMin + yMax) / 2;
  const range = Math.max(xMax - xMin, yMax - yMin);

  return {
    project(ra: number, dec: number): { x: number; y: number } {
      const { px, py } = gnomonic(ra, dec, ra0, sinD0, cosD0);
      // East = left (negate x offset); north = up (SVG y inverted, so negate y offset).
      return {
        x: 50 - ((px - xCentre) / range) * 90,
        y: 50 - ((py - yCentre) / range) * 90,
      };
    },
  };
}
