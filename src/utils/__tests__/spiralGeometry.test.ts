import {
  SPIRAL_A,
  SPIRAL_B,
  SPIRAL_T_START,
  SPIRAL_T_END,
  GALACTIC_CENTRE_WORLD_Y,
  spiralWorldPoint,
  nearestSpiralT,
  distanceToSpiral,
  pointInSpiralBand,
  pointInEllipse,
  pointInRegionShape,
} from "../spiralGeometry";
import type { SpiralBandShape, EllipseShape } from "../../types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe("spiralGeometry — constants", () => {
  it("SPIRAL_T_END corresponds to r ≈ 52000 ly", () => {
    const r = SPIRAL_A * Math.exp(SPIRAL_B * SPIRAL_T_END);
    expect(r).toBeCloseTo(52000, 0);
  });

  it("SPIRAL_T_START produces r > SPIRAL_A", () => {
    const r = SPIRAL_A * Math.exp(SPIRAL_B * SPIRAL_T_START);
    expect(r).toBeGreaterThan(SPIRAL_A);
  });

  it("GALACTIC_CENTRE_WORLD_Y is -26000", () => {
    expect(GALACTIC_CENTRE_WORLD_Y).toBe(-26000);
  });
});

// ---------------------------------------------------------------------------
// spiralWorldPoint
// ---------------------------------------------------------------------------
describe("spiralGeometry — spiralWorldPoint", () => {
  it("at t=0, offset=0: x = SPIRAL_A, y = GALACTIC_CENTRE_WORLD_Y (sin(0)=0)", () => {
    const [x, y] = spiralWorldPoint(0, 0);
    // r = SPIRAL_A, theta = 0 → x = SPIRAL_A, y_galacto = 0 → world_y = GALACTIC_CENTRE_WORLD_Y
    expect(x).toBeCloseTo(SPIRAL_A, 4);
    expect(y).toBeCloseTo(GALACTIC_CENTRE_WORLD_Y, 4);
  });

  it("offset shifts the angular position by the given radians", () => {
    const t = 5;
    const [x0, y0] = spiralWorldPoint(t, 0);
    const [xPi, yPi] = spiralWorldPoint(t, Math.PI);
    // rotating by π negates x and y_galactocentric → world_y flips about GALACTIC_CENTRE_WORLD_Y
    expect(xPi).toBeCloseTo(-x0, 3);
    expect(yPi - GALACTIC_CENTRE_WORLD_Y).toBeCloseTo(
      -(y0 - GALACTIC_CENTRE_WORLD_Y),
      3,
    );
  });

  it("world y matches formula: y = -r*sin(theta) + GALACTIC_CENTRE_WORLD_Y", () => {
    // theta = π/2 → sin(θ)=1, cos(θ)=0 → x=0, world_y = -r + GALACTIC_CENTRE_WORLD_Y
    const t = 2;
    const r = SPIRAL_A * Math.exp(SPIRAL_B * t);
    const offset = Math.PI / 2 - t; // makes theta = π/2
    const [x, y] = spiralWorldPoint(t, offset);
    expect(x).toBeCloseTo(0, 3);
    expect(y).toBeCloseTo(-r + GALACTIC_CENTRE_WORLD_Y, 1);
  });

  it("r grows with t (logarithmic spiral property)", () => {
    const [x1, y1] = spiralWorldPoint(5, 0);
    const [x2, y2] = spiralWorldPoint(10, 0);
    const r1 = Math.hypot(x1, y1 - GALACTIC_CENTRE_WORLD_Y);
    const r2 = Math.hypot(x2, y2 - GALACTIC_CENTRE_WORLD_Y);
    expect(r2).toBeGreaterThan(r1);
  });
});

// ---------------------------------------------------------------------------
// nearestSpiralT
// ---------------------------------------------------------------------------
describe("spiralGeometry — nearestSpiralT", () => {
  it("a point on the spiral returns approximately its own t", () => {
    const T = 10;
    const OFFSET = 0;
    const [px, py] = spiralWorldPoint(T, OFFSET);
    const found = nearestSpiralT(px, py, OFFSET, SPIRAL_T_START, SPIRAL_T_END);
    expect(found).toBeCloseTo(T, 1);
  });

  it("works with a non-zero offset", () => {
    const T = 8;
    const OFFSET = Math.PI / 2;
    const [px, py] = spiralWorldPoint(T, OFFSET);
    const found = nearestSpiralT(px, py, OFFSET, SPIRAL_T_START, SPIRAL_T_END);
    expect(found).toBeCloseTo(T, 1);
  });
});

// ---------------------------------------------------------------------------
// distanceToSpiral
// ---------------------------------------------------------------------------
describe("spiralGeometry — distanceToSpiral", () => {
  it("a point exactly on the spiral has distance < 1 ly", () => {
    const T = 9;
    const [px, py] = spiralWorldPoint(T, 0);
    const d = distanceToSpiral(px, py, 0, SPIRAL_T_START, SPIRAL_T_END);
    expect(d).toBeLessThan(1);
  });

  it("distance is positive for a point off the spiral", () => {
    const d = distanceToSpiral(0, 0, 0, SPIRAL_T_START, SPIRAL_T_END);
    expect(d).toBeGreaterThan(0);
  });

  it("distance grows as the point moves further from the centreline", () => {
    const T = 10;
    const [px, py] = spiralWorldPoint(T, 0);
    const d1 = distanceToSpiral(px + 500, py, 0, SPIRAL_T_START, SPIRAL_T_END);
    const d2 = distanceToSpiral(px + 2000, py, 0, SPIRAL_T_START, SPIRAL_T_END);
    expect(d2).toBeGreaterThan(d1);
  });
});

// ---------------------------------------------------------------------------
// pointInSpiralBand
// ---------------------------------------------------------------------------
describe("spiralGeometry — pointInSpiralBand", () => {
  const band: SpiralBandShape = {
    type: "spiralBand",
    armOffset: 0,
    halfWidth: 2000,
    tStart: SPIRAL_T_START,
    tEnd: SPIRAL_T_END,
  };

  it("a point on the centreline is inside the band", () => {
    const [px, py] = spiralWorldPoint(10, 0);
    expect(pointInSpiralBand(px, py, band)).toBe(true);
  });

  it("a point 3× halfWidth from the centreline is outside the band", () => {
    const [px, py] = spiralWorldPoint(10, 0);
    // displacing by 3× halfWidth is always outside regardless of curvature
    expect(pointInSpiralBand(px + band.halfWidth * 3, py, band)).toBe(false);
  });

  it("galactic centre (r=0) is outside the band — inner spiral boundary is ~2184 ly from centre", () => {
    // The spiral starts at r≈2184 ly (tStart=0.4); galactic centre at world (0, -26000)
    // has distance 2184 ly to the nearest spiral point, which exceeds halfWidth=2000.
    expect(pointInSpiralBand(0, -26000, band)).toBe(false);
  });

  it("a point well inside (100 ly off-centreline) is in the band", () => {
    const [px, py] = spiralWorldPoint(10, 0);
    expect(pointInSpiralBand(px + 100, py, band)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pointInEllipse
// ---------------------------------------------------------------------------
describe("spiralGeometry — pointInEllipse", () => {
  const ellipse: EllipseShape = {
    type: "ellipse",
    cx: 0,
    cy: 0,
    rx: 3000,
    ry: 1500,
    angleRad: 0,
  };

  it("centre is inside", () => {
    expect(pointInEllipse(0, 0, ellipse)).toBe(true);
  });

  it("point at (rx, 0) is on the boundary", () => {
    // exactly on boundary → (1)^2 + 0 = 1 ≤ 1, so inside (inclusive)
    expect(pointInEllipse(3000, 0, ellipse)).toBe(true);
  });

  it("point just beyond rx is outside", () => {
    expect(pointInEllipse(3001, 0, ellipse)).toBe(false);
  });

  it("point at (0, ry) is on the boundary", () => {
    expect(pointInEllipse(0, 1500, ellipse)).toBe(true);
  });

  it("point just beyond ry is outside", () => {
    expect(pointInEllipse(0, 1501, ellipse)).toBe(false);
  });

  it("respects the cx/cy offset", () => {
    const shifted: EllipseShape = { ...ellipse, cx: 5000, cy: -3000 };
    expect(pointInEllipse(5000, -3000, shifted)).toBe(true);
    expect(pointInEllipse(0, 0, shifted)).toBe(false);
  });

  it("respects rotation: point on the rotated major axis is inside", () => {
    const rotated: EllipseShape = { ...ellipse, angleRad: Math.PI / 4 };
    // After 45° rotation, major axis (rx=3000) is along y=x diagonal
    const r = 2000 / Math.sqrt(2);
    expect(pointInEllipse(r, r, rotated)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// pointInRegionShape — dispatch
// ---------------------------------------------------------------------------
describe("spiralGeometry — pointInRegionShape", () => {
  it("dispatches spiralBand correctly", () => {
    const shape: SpiralBandShape = {
      type: "spiralBand",
      armOffset: 0,
      halfWidth: 2000,
      tStart: SPIRAL_T_START,
      tEnd: SPIRAL_T_END,
    };
    const [px, py] = spiralWorldPoint(10, 0);
    expect(pointInRegionShape(px, py, shape)).toBe(true);
    expect(pointInRegionShape(px + 50000, py + 50000, shape)).toBe(false);
  });

  it("dispatches ellipse correctly", () => {
    const shape: EllipseShape = {
      type: "ellipse",
      cx: 1000,
      cy: 2000,
      rx: 500,
      ry: 300,
      angleRad: 0,
    };
    expect(pointInRegionShape(1000, 2000, shape)).toBe(true);
    expect(pointInRegionShape(0, 0, shape)).toBe(false);
  });
});
