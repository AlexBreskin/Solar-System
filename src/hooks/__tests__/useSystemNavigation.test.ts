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

  it("starts with loadingSystem false", () => {
    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), vi.fn(), vi.fn(), vi.fn()),
    );
    expect(result.current.loadingSystem).toBe(false);
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

  it("handleSystemChange loads the system and calls all callbacks on success", async () => {
    const fakeSystem = makeFakeSystem("alpha-centauri", "alpha");
    mockLoadStarSystem.mockResolvedValueOnce(fakeSystem);
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
    await act(async () => {
      result.current.handleSystemChange("alpha-centauri");
    });
    expect(setSystemData).toHaveBeenCalledWith(fakeSystem);
    expect(onGalaxySelect).toHaveBeenCalledWith("alpha-centauri");
    expect(onBodyReset).toHaveBeenCalledWith("alpha");
    expect(onTabChange).toHaveBeenCalledWith("solar-system");
    expect(result.current.loadingSystem).toBe(false);
  });

  it("handleSystemChange falls back to system id when no root-type body found", async () => {
    const fakeSystem = makeFakeSystem("mystery", "mystery");
    fakeSystem.bodies["mystery"].type = BodyType.Planet;
    mockLoadStarSystem.mockResolvedValueOnce(fakeSystem);
    const onBodyReset = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), vi.fn(), vi.fn(), onBodyReset),
    );
    await act(async () => {
      result.current.handleSystemChange("mystery");
    });
    expect(onBodyReset).toHaveBeenCalledWith("mystery");
  });

  it("handleSystemChange clears loadingSystem on failure", async () => {
    mockLoadStarSystem.mockRejectedValueOnce(new Error("network error"));
    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), vi.fn(), vi.fn(), vi.fn()),
    );
    await act(async () => {
      result.current.handleSystemChange("bad-system");
    });
    expect(result.current.loadingSystem).toBe(false);
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

  it("ignores stale .then() when a newer load has already completed", async () => {
    let resolveA!: (v: unknown) => void;
    let resolveB!: (v: unknown) => void;
    const promiseA = new Promise((res) => {
      resolveA = res;
    });
    const promiseB = new Promise((res) => {
      resolveB = res;
    });
    mockLoadStarSystem
      .mockReturnValueOnce(promiseA)
      .mockReturnValueOnce(promiseB);

    const fakeSysA = makeFakeSystem("alpha-centauri", "alpha");
    const fakeSysB = makeFakeSystem("betelgeuse", "betel");
    const setSystemData = vi.fn();
    const onBodyReset = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", setSystemData, vi.fn(), vi.fn(), onBodyReset),
    );

    act(() => result.current.handleSystemChange("alpha-centauri")); // gen = 1
    act(() => result.current.handleSystemChange("betelgeuse")); // gen = 2

    await act(async () => {
      resolveB(fakeSysB);
    });
    expect(setSystemData).toHaveBeenCalledTimes(1);
    expect(setSystemData).toHaveBeenCalledWith(fakeSysB);

    await act(async () => {
      resolveA(fakeSysA); // stale — gen=1 != loadGenRef.current=2, should be ignored
    });
    expect(setSystemData).toHaveBeenCalledTimes(1); // still 1
    expect(onBodyReset).toHaveBeenCalledTimes(1); // only called for B
  });

  it("does not clear loadingSystem when a stale load rejects", async () => {
    let rejectA!: (e: Error) => void;
    const promiseA = new Promise<unknown>((_, rej) => {
      rejectA = rej;
    });
    // promiseB never resolves — simulates still-loading second request
    const promiseB = new Promise<unknown>(() => {});
    mockLoadStarSystem
      .mockReturnValueOnce(promiseA)
      .mockReturnValueOnce(promiseB);

    const { result } = renderHook(() =>
      useSystemNavigation("sol", vi.fn(), vi.fn(), vi.fn(), vi.fn()),
    );

    act(() => result.current.handleSystemChange("alpha-centauri")); // gen = 1
    act(() => result.current.handleSystemChange("betelgeuse")); // gen = 2

    await act(async () => {
      rejectA(new Error("stale rejection")); // gen=1, loadGenRef=2 → should NOT clear loadingSystem
    });
    expect(result.current.loadingSystem).toBe(true); // still loading B
  });

  it("handleExploreSystem for a different system triggers handleSystemChange", async () => {
    const fakeSystem = makeFakeSystem("proxima", "proxima-star");
    mockLoadStarSystem.mockResolvedValueOnce(fakeSystem);
    const setSystemData = vi.fn();
    const { result } = renderHook(() =>
      useSystemNavigation("sol", setSystemData, vi.fn(), vi.fn(), vi.fn()),
    );
    await act(async () => {
      result.current.handleExploreSystem("proxima");
    });
    expect(setSystemData).toHaveBeenCalledWith(fakeSystem);
  });
});
