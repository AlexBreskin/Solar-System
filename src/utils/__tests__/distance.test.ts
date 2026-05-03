import {
  auToKm,
  AU_PER_LY,
  formatAU,
  formatKm,
  formatLY,
  KM_PER_AU,
  lyToAU,
} from "../distance";

describe("auToKm", () => {
  it("converts 0 AU to 0 km", () => {
    expect(auToKm(0)).toBe(0);
  });

  it("converts 1 AU to the IAU definition", () => {
    expect(auToKm(1)).toBeCloseTo(KM_PER_AU, 1);
  });

  it("scales linearly", () => {
    expect(auToKm(2)).toBeCloseTo(KM_PER_AU * 2, 1);
  });
});

describe("formatKm", () => {
  it("returns — for 0", () => {
    expect(formatKm(0)).toBe("—");
  });

  it("returns full integer for small distances (< 10,000 km)", () => {
    expect(formatKm(100)).toBe("100 km");
    expect(formatKm(9_999)).toBe("9,999 km");
  });

  it("rounds to nearest integer for small distances", () => {
    expect(formatKm(1234.7)).toBe("1,235 km");
  });

  it("uses scientific notation at exactly 10,000 km", () => {
    expect(formatKm(10_000)).toBe("1.00 × 10⁴ km");
  });

  it("formats TRAPPIST-1e distance correctly (~4.38 × 10⁶ km)", () => {
    const km = auToKm(0.02925);
    expect(formatKm(km)).toBe("4.38 × 10⁶ km");
  });

  it("formats 1 AU in km correctly (~1.50 × 10⁸ km)", () => {
    expect(formatKm(KM_PER_AU)).toBe("1.50 × 10⁸ km");
  });

  it("uses superscript minus for negative exponents", () => {
    expect(formatKm(0.5)).toBe("1 km");
  });
});

describe("formatAU", () => {
  it("returns — for 0", () => {
    expect(formatAU(0)).toBe("—");
  });

  it("gives 5 decimal places for values like 0.01154 (TRAPPIST-1b)", () => {
    expect(formatAU(0.01154)).toBe("0.01154 AU");
  });

  it("gives 5 decimal places for 0.02925 (TRAPPIST-1e)", () => {
    expect(formatAU(0.02925)).toBe("0.02925 AU");
  });

  it("gives 4 decimal places for values between 0.1 and 1", () => {
    expect(formatAU(0.7048)).toBe("0.7048 AU");
  });

  it("gives 3 decimal places for values between 1 and 10", () => {
    expect(formatAU(5.204)).toBe("5.204 AU");
    expect(formatAU(1.0)).toBe("1.000 AU");
  });

  it("gives 2 decimal places for values between 10 and 100", () => {
    expect(formatAU(23.4)).toBe("23.40 AU");
  });

  it("gives 1 decimal place for values between 100 and 1000", () => {
    expect(formatAU(228.776)).toBe("228.8 AU");
  });

  it("gives 0 decimal places for values >= 1000", () => {
    expect(formatAU(13400)).toBe("13400 AU");
  });
});

describe("lyToAU", () => {
  it("converts 0 ly to 0 AU", () => {
    expect(lyToAU(0)).toBe(0);
  });

  it("converts 1 ly to AU_PER_LY", () => {
    expect(lyToAU(1)).toBeCloseTo(AU_PER_LY, 1);
  });

  it("converts Alpha Centauri distance correctly", () => {
    expect(lyToAU(4.37)).toBeCloseTo(4.37 * AU_PER_LY, 1);
  });
});

describe("formatLY", () => {
  it("returns — for 0", () => {
    expect(formatLY(0)).toBe("—");
  });

  it("gives 4 decimal places for values below 0.1 ly", () => {
    expect(formatLY(0.0012)).toBe("0.0012 ly");
  });

  it("gives 2 decimal places for values between 0.1 and 10 ly", () => {
    expect(formatLY(4.37)).toBe("4.37 ly");
    expect(formatLY(11.9)).toBe("11.9 ly");
  });

  it("gives 1 decimal place for values between 10 and 1000 ly", () => {
    expect(formatLY(39)).toBe("39.0 ly");
    expect(formatLY(245)).toBe("245.0 ly");
  });

  it("gives 0 decimal places with locale separator for values >= 1000 ly", () => {
    expect(formatLY(2545)).toBe("2,545 ly");
  });

  it("uses scientific notation for distances >= 1,000,000 ly (quasar scale)", () => {
    expect(formatLY(2_400_000_000)).toBe("2.40 × 10⁹ ly");
    expect(formatLY(10_400_000_000)).toBe("1.04 × 10¹⁰ ly");
  });
});
