import { lighten } from "../color";

describe("lighten", () => {
  it("lightens each channel by the given amount", () => {
    expect(lighten("#000000", 10)).toBe("rgb(10,10,10)");
  });

  it("clamps channels at 255", () => {
    expect(lighten("#ffffff", 50)).toBe("rgb(255,255,255)");
  });

  it("handles mixed channels independently", () => {
    expect(lighten("#ff0080", 20)).toBe("rgb(255,20,148)");
  });

  it("leaves channels unchanged when amount is 0", () => {
    expect(lighten("#4a6b8c", 0)).toBe("rgb(74,107,140)");
  });
});
