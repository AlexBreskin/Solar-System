import { act } from "react";
import { useSystemNavigation } from "../useSystemNavigation";
import { renderHook } from "../../utils/renderHook";
import { BodyType } from "../../types";
import type { StarSystemData } from "../../shared/contexts/StarSystemContext";

vi.mock("../../data/celestialBodies", () => ({
  loadStarSystem: vi.fn(),
  CELESTIAL_BODIES: {},
  BODY_HIERARCHY: [],
  VISUAL_CONFIG: {},
}));

import { loadStarSystem } from "../../data/celestialBodies";
const mockLoadStarSystem = loadStarSystem as ReturnType<typeof vi.fn>;

function makeFakeSystem(id: string, starBodyId: string): StarSystemData {
  return {
    id,
    meta: {
      id,
      name: id,
      description: "",
      starColor: "#fff",
    },
    bodies: {
      [starBodyId]: {
        id: starBodyId,
        name: starBodyId,
        type: BodyType.Star,
        parent: null,
        diameter: 1,
        mass: "1",
        distanceFromParent: 0,
        orbitalPeriod: 0,
        rotationPeriod: 0,
        eccentricity: 0,
        inclination: 0,
        color: "#fff",
        description: "",
        surfaceTemp: "",
        moons: 0,
        funFact: "",
      },
    },
    hierarchy: [],
    visualConfig: {
      orbitScale: 1,
      sizeScale: 1,
      minBodyRadius: 1,
      starGlowRadius: 1,
      starGlowOpacity: 1,
    },
  };
}

describe("useSystemNavigation", () => {
  beforeEach(() => {
    mockLoadStarSystem.mockReset();
  });

  it("handleSystemChange is a no-op when id matches current system", () => {
    const setSystemData = vi.fn();
    const onGalaxySelect = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation(
        "sol",
        setSystemData,
        onGalaxySelect,
        vi.fn(),
        vi.fn(),
      ),
    );
    act(() => result.current.handleSystemChange("sol"));
    expect(mockLoadStarSystem).not.toHaveBeenCalled();
    expect(setSystemData).not.toHaveBeenCalled();
    expect(onGalaxySelect).not.toHaveBeenCalled();
  });

  it("handleSystemChange loads the system and calls all callbacks", () => {
    const fakeSystem = makeFakeSystem("alpha-centauri", "alpha");
    mockLoadStarSystem.mockReturnValueOnce(fakeSystem);
    const setSystemData = vi.fn();
    const onGalaxySelect = vi.fn();
    const onTabChange = vi.fn();
    const onBodyReset = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation(
        "sol",
        setSystemData,
        onGalaxySelect,
        onTabChange,
        onBodyReset,
      ),
    );
    act(() => result.current.handleSystemChange("alpha-centauri"));
    expect(setSystemData).toHaveBeenCalledWith(fakeSystem);
    expect(onGalaxySelect).toHaveBeenCalledWith("alpha-centauri");
    expect(onBodyReset).toHaveBeenCalledWith("alpha");
    expect(onTabChange).toHaveBeenCalledWith("solar-system");
  });

  it("handleSystemChange falls back to system id when no root-type body found", () => {
    const fakeSystem = makeFakeSystem("mystery", "mystery");
    fakeSystem.bodies["mystery"].type = BodyType.Planet;
    mockLoadStarSystem.mockReturnValueOnce(fakeSystem);
    const onBodyReset = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), vi.fn(), vi.fn(), onBodyReset),
    );
    act(() => result.current.handleSystemChange("mystery"));
    expect(onBodyReset).toHaveBeenCalledWith("mystery");
  });

  it("handleSystemChange silently ignores unknown systems", () => {
    mockLoadStarSystem.mockImplementationOnce(() => {
      throw new Error("Unknown system: bad-system");
    });
    const setSystemData = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", setSystemData, vi.fn(), vi.fn(), vi.fn()),
    );
    act(() => result.current.handleSystemChange("bad-system"));
    expect(setSystemData).not.toHaveBeenCalled();
  });

  it("handleExploreSystem for current system calls onTabChange without loading", () => {
    const onTabChange = vi.fn();
    const onGalaxySelect = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), onGalaxySelect, onTabChange, vi.fn()),
    );
    act(() => result.current.handleExploreSystem("sol"));
    expect(onGalaxySelect).toHaveBeenCalledWith("sol");
    expect(onTabChange).toHaveBeenCalledWith("solar-system");
    expect(mockLoadStarSystem).not.toHaveBeenCalled();
  });

  it("handleExploreSystem for a different system triggers handleSystemChange", () => {
    const fakeSystem = makeFakeSystem("proxima", "proxima-star");
    mockLoadStarSystem.mockReturnValueOnce(fakeSystem);
    const setSystemData = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", setSystemData, vi.fn(), vi.fn(), vi.fn()),
    );
    act(() => result.current.handleExploreSystem("proxima"));
    expect(setSystemData).toHaveBeenCalledWith(fakeSystem);
  });
});
