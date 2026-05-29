import { act } from "react";
import { useBodySelection } from "../useBodySelection";
import { renderHook } from "../../utils/renderHook";
import { BodyType } from "../../types";
import type { CelestialBody, TabId } from "../../types";

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
  belt: makeBody("belt", BodyType.Belt),
};

describe("useBodySelection", () => {
  it("starts with default values", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    expect(result.current.selectedBody).toBe("sun");
    expect(result.current.hoveredBody).toBeNull();
    expect(result.current.trackedBody).toBeNull();
    expect(result.current.viewedPlanet).toBe("earth");
    expect(result.current.showSystemPanel).toBe(false);
  });

  it("handleSelectBody in solar-system tab sets tracking for non-belt bodies", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleSelectBody("earth"));
    expect(result.current.selectedBody).toBe("earth");
    expect(result.current.trackedBody).toBe("earth");
    expect(result.current.showSystemPanel).toBe(false);
  });

  it("handleSelectBody on a Belt clears tracking", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleSelectBody("earth"));
    act(() => result.current.handleSelectBody("belt"));
    expect(result.current.selectedBody).toBe("belt");
    expect(result.current.trackedBody).toBeNull();
  });

  it("handleSelectBody outside solar-system tab does not change tracking", () => {
    const { result } = renderHook(() =>
      useBodySelection("planet-view" as TabId, bodies),
    );
    act(() => result.current.handleSelectBody("earth"));
    expect(result.current.selectedBody).toBe("earth");
    expect(result.current.trackedBody).toBeNull();
  });

  it("handleHoverBody updates hoveredBody", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleHoverBody("moon"));
    expect(result.current.hoveredBody).toBe("moon");
    act(() => result.current.handleHoverBody(null));
    expect(result.current.hoveredBody).toBeNull();
  });

  it("handleTrackBody toggles tracking off when called twice with same id", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleTrackBody("earth"));
    expect(result.current.trackedBody).toBe("earth");
    act(() => result.current.handleTrackBody("earth"));
    expect(result.current.trackedBody).toBeNull();
  });

  it("handleTrackBody also sets selectedBody", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleTrackBody("moon"));
    expect(result.current.selectedBody).toBe("moon");
  });

  it("handleTrackBody with null clears tracking without changing selectedBody", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleSelectBody("earth"));
    act(() => result.current.handleTrackBody(null));
    expect(result.current.trackedBody).toBeNull();
    expect(result.current.selectedBody).toBe("earth");
  });

  it("handleViewPlanet sets viewedPlanet", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleViewPlanet("moon"));
    expect(result.current.viewedPlanet).toBe("moon");
  });

  it("resetForNewSystem clears all body state", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.handleSelectBody("earth"));
    act(() => result.current.handleHoverBody("moon"));
    act(() => result.current.handleViewPlanet("moon"));
    act(() => result.current.setShowSystemPanel(true));
    act(() => result.current.resetForNewSystem("proxima"));
    expect(result.current.selectedBody).toBe("proxima");
    expect(result.current.hoveredBody).toBeNull();
    expect(result.current.trackedBody).toBeNull();
    expect(result.current.viewedPlanet).toBe("proxima");
    expect(result.current.showSystemPanel).toBe(false);
  });

  it("setShowSystemPanel exposes panel visibility control", () => {
    const { result } = renderHook(() =>
      useBodySelection("solar-system", bodies),
    );
    act(() => result.current.setShowSystemPanel(true));
    expect(result.current.showSystemPanel).toBe(true);
    act(() => result.current.setShowSystemPanel(false));
    expect(result.current.showSystemPanel).toBe(false);
  });
});
