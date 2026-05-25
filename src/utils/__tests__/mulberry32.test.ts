import { mulberry32 } from "../mulberry32";

describe("mulberry32", () => {
  it("returns a function", () => {
    expect(typeof mulberry32(42)).toBe("function");
  });

  it("returns values in [0, 1)", () => {
    const rng = mulberry32(12345);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for the same seed", () => {
    const a = mulberry32(99);
    const b = mulberry32(99);
    for (let i = 0; i < 20; i++) {
      expect(a()).toBe(b());
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    expect(a()).not.toBe(b());
  });
});
