import { buildProjection } from "../constellationProjection";

describe("buildProjection", () => {
  describe("empty lines", () => {
    it("returns a projection that always returns the SVG centre (50,50)", () => {
      const proj = buildProjection([]);
      expect(proj.project(0, 0)).toEqual({ x: 50, y: 50 });
      expect(proj.project(180, 45)).toEqual({ x: 50, y: 50 });
      expect(proj.project(-90, -30)).toEqual({ x: 50, y: 50 });
    });
  });

  describe("single-point constellation", () => {
    it("projects the centroid point to approximately (50, 50)", () => {
      const proj = buildProjection([
        [
          [10, 20],
          [10, 20],
        ],
      ]);
      const { x, y } = proj.project(10, 20);
      expect(x).toBeCloseTo(50, 0);
      expect(y).toBeCloseTo(50, 0);
    });
  });

  describe("east = left convention", () => {
    it("a point with higher RA (more east) projects to a smaller x value", () => {
      const proj = buildProjection([
        [
          [0, 0],
          [60, 0],
        ],
      ]);
      const west = proj.project(0, 0);
      const east = proj.project(60, 0);
      expect(east.x).toBeLessThan(west.x);
    });
  });

  describe("north = up convention", () => {
    it("a point with higher dec (more north) projects to a smaller y value", () => {
      const proj = buildProjection([
        [
          [30, -30],
          [30, 30],
        ],
      ]);
      const south = proj.project(30, -30);
      const north = proj.project(30, 30);
      expect(north.y).toBeLessThan(south.y);
    });
  });

  describe("viewport bounds", () => {
    it("all line endpoints project within [0, 100] when padding is applied", () => {
      const lines = [
        [
          [0, 0],
          [90, 0],
        ],
        [
          [45, -30],
          [45, 30],
        ],
      ];
      const proj = buildProjection(lines);
      for (const seg of lines) {
        for (const [ra, dec] of seg) {
          const { x, y } = proj.project(ra, dec);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(100);
        }
      }
    });

    it("stars extend the bounding box so star points are within the viewport", () => {
      const lines = [
        [
          [0, 0],
          [10, 0],
        ],
      ];
      const stars = [{ name: "off-star", ra: 5, dec: 20, mag: 1 }];
      const proj = buildProjection(lines, stars);
      const { x, y } = proj.project(5, 20);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    });
  });

  describe("polar constellation (near north pole)", () => {
    it("handles high-declination constellations without producing out-of-range values", () => {
      const lines = [
        [
          [-123.98, 77.79],
          [-115.62, 75.75],
        ],
        [
          [-108.51, 82.04],
          [-96.95, 86.59],
        ],
      ];
      const proj = buildProjection(lines);
      for (const seg of lines) {
        for (const [ra, dec] of seg) {
          const { x, y } = proj.project(ra, dec);
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(100);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe("padding behaviour", () => {
    it("uses minimum padding of 0.02 when constellation spans a tiny angle", () => {
      // Two very close points; padding should not collapse to zero
      const proj = buildProjection([
        [
          [0, 0],
          [0.001, 0.001],
        ],
      ]);
      const { x, y } = proj.project(0, 0);
      // If padding worked, the centroid still maps somewhere reasonable
      expect(x).toBeGreaterThan(0);
      expect(x).toBeLessThan(100);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(100);
    });

    it("uses percentage padding (12%) when constellation spans a larger angle", () => {
      // Wide constellation — bounds span >0.167 radians so 12% pct > 0.02 minimum
      const proj = buildProjection([
        [
          [0, -45],
          [180, 45],
        ],
      ]);
      const { x, y } = proj.project(90, 0);
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(100);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(100);
    });
  });
});
