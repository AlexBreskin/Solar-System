import { getPlanetViewId } from "../getPlanetViewId";
import { BodyType } from "../../types";
import type { CelestialBody } from "../../types";

function makeBody(
  id: string,
  type: BodyType,
  parent: string | null = null,
): CelestialBody {
  return {
    id,
    name: id,
    type,
    parent,
    diameter: 1,
    mass: "1",
    distanceFromParent: 1,
    orbitalPeriod: 1,
    rotationPeriod: 1,
    eccentricity: 0,
    inclination: 0,
    color: "#fff",
    description: "",
    surfaceTemp: "",
    moons: 0,
    funFact: "",
  };
}

const bodies = {
  sun: makeBody("sun", BodyType.Star),
  earth: makeBody("earth", BodyType.Planet),
  moon: makeBody("moon", BodyType.Moon, "earth"),
  titan: makeBody("titan", BodyType.Moon, "saturn"),
  europa: makeBody("europa", BodyType.Companion, "jupiter"),
  asteroid_belt: makeBody("asteroid_belt", BodyType.Belt),
};

describe("getPlanetViewId", () => {
  it("returns the parent when selectedBody is a Moon", () => {
    expect(getPlanetViewId("moon", bodies)).toBe("earth");
  });

  it("returns the parent when selectedBody is a Companion", () => {
    expect(getPlanetViewId("europa", bodies)).toBe("jupiter");
  });

  it("returns the body itself when it is a Planet", () => {
    expect(getPlanetViewId("earth", bodies)).toBe("earth");
  });

  it("returns the body itself when it is a Star", () => {
    expect(getPlanetViewId("sun", bodies)).toBe("sun");
  });

  it("returns null for a Belt body", () => {
    expect(getPlanetViewId("asteroid_belt", bodies)).toBeNull();
  });

  it("returns null when the body does not exist in the map", () => {
    expect(getPlanetViewId("unknown", bodies)).toBeNull();
  });

  it("returns the parent id as a BodyId string", () => {
    const result = getPlanetViewId("titan", bodies);
    expect(result).toBe("saturn");
  });

  it("returns the Moon itself when parent field is null (falls back to self)", () => {
    const orphanMoon = makeBody("orphan", BodyType.Moon, null);
    expect(getPlanetViewId("orphan", { ...bodies, orphan: orphanMoon })).toBe(
      "orphan",
    );
  });
});
