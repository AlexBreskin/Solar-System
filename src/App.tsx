import { useState, useCallback, useMemo, useRef } from "react";
import SystemCanvas from "@/components/system-view/SystemCanvas";
import PlanetCanvas from "@/components/planet-view/PlanetCanvas";
import GalaxyCanvas, {
  type GalaxyCanvasHandle,
} from "@/components/galaxy-view/GalaxyCanvas";
import BodyNavigator from "@/components/system-view/BodyNavigator";
import GalaxyNavigator from "@/components/galaxy-view/GalaxyNavigator";
import InfoPanel from "@/components/system-view/InfoPanel";
import GalaxySystemPanel from "@/components/galaxy-view/GalaxySystemPanel";
import { loadStarSystem } from "@/data/celestialBodies";
import { STAR_SYSTEMS } from "@/data/systems";
import { CONSTELLATIONS } from "@/data/constellations";
import {
  StarSystemContext,
  type StarSystemData,
} from "@/shared/contexts/StarSystemContext";
import {
  CELESTIAL_BODIES,
  BODY_HIERARCHY,
  VISUAL_CONFIG,
} from "@/data/celestialBodies";
import { BodyType, ROOT_BODY_TYPES } from "@/types";
import type { BodyId, TabId, StarSystemMeta } from "@/types";
import "./App.css";

const defaultSystemData: StarSystemData = {
  id: "sol",
  meta:
    STAR_SYSTEMS.find((s) => s.id === "sol") ??
    ({
      id: "sol",
      name: "Solar System",
      description:
        "Our home system — 8 planets, 5 dwarf planets, and two asteroid belts orbiting the Sun.",
      starColor: "#FDB813",
      displayOrder: 0,
    } as StarSystemMeta),
  bodies: CELESTIAL_BODIES,
  hierarchy: BODY_HIERARCHY,
  visualConfig: VISUAL_CONFIG,
};

export default function App(): JSX.Element {
  const [systemData, setSystemData] =
    useState<StarSystemData>(defaultSystemData);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("solar-system");
  const [selectedBody, setSelectedBody] = useState<BodyId>("sun");
  const [hoveredBody, setHoveredBody] = useState<BodyId | null>(null);
  const [trackedBody, setTrackedBody] = useState<BodyId | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [paused, setPaused] = useState<boolean>(false);
  const [showOrbits, setShowOrbits] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [viewedPlanet, setViewedPlanet] = useState<BodyId>("earth");
  const [galaxySelectedSystem, setGalaxySelectedSystem] = useState<
    string | null
  >(defaultSystemData.id);
  const [galaxyHoveredSystem, setGalaxyHoveredSystem] = useState<string | null>(
    null,
  );
  const [galaxySelectedRegion, setGalaxySelectedRegion] = useState<
    string | null
  >(null);
  const [galaxySelectedConstellation, setGalaxySelectedConstellation] =
    useState<string | null>(null);
  const [showSystemPanel, setShowSystemPanel] = useState<boolean>(false);
  const galaxyCanvasRef = useRef<GalaxyCanvasHandle>(null);

  const constellationSystemIds = useMemo(() => {
    if (!galaxySelectedConstellation) return new Set<string>();
    const c = CONSTELLATIONS.find((c) => c.id === galaxySelectedConstellation);
    return new Set(c?.systems ?? []);
  }, [galaxySelectedConstellation]);

  const handleSystemChange = useCallback(
    (id: string) => {
      if (id === systemData.id) return;
      setLoadingSystem(true);
      loadStarSystem(id)
        .then((loaded) => {
          const starId =
            Object.values(loaded.bodies).find((b) =>
              ROOT_BODY_TYPES.has(b.type),
            )?.id ?? id;
          setSystemData(loaded);
          setGalaxySelectedSystem(id);
          setSelectedBody(starId);
          setHoveredBody(null);
          setTrackedBody(null);
          setViewedPlanet(starId);
          setActiveTab("solar-system");
          setLoadingSystem(false);
        })
        .catch(() => setLoadingSystem(false));
    },
    [systemData.id],
  );

  const handleSelectBody = useCallback(
    (id: BodyId) => {
      setSelectedBody(id);
      setShowSystemPanel(false);
      if (activeTab === "solar-system") {
        if (systemData.bodies[id]?.type === BodyType.Belt) setTrackedBody(null);
        else setTrackedBody(id);
      }
    },
    [activeTab, systemData.bodies],
  );

  const handleHoverBody = useCallback(
    (id: BodyId | null) => setHoveredBody(id),
    [],
  );

  const handleTrackBody = useCallback((id: BodyId | null) => {
    setTrackedBody((prev) => (prev === id ? null : id));
    if (id) setSelectedBody(id);
  }, []);

  const handleViewPlanet = useCallback((id: BodyId) => {
    setViewedPlanet(id);
  }, []);

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      if (tab === "planet-view") {
        const body = systemData.bodies[selectedBody];
        if (
          (body?.type === BodyType.Moon || body?.type === BodyType.Companion) &&
          body.parent
        ) {
          setViewedPlanet(body.parent);
        } else if (body && body.type !== BodyType.Belt) {
          setViewedPlanet(selectedBody);
        }
        setTrackedBody(null);
      }
    },
    [selectedBody, systemData.bodies],
  );

  const handleGoToSolarSystem = useCallback(() => {
    setActiveTab("solar-system");
  }, []);

  const handleGoToGalaxy = useCallback(() => {
    setActiveTab("galaxy");
  }, []);

  const handleSelectSystem = useCallback(() => {
    setShowSystemPanel(true);
    setTrackedBody(null);
  }, []);

  const handleExploreSystem = useCallback(
    (id: string) => {
      setGalaxySelectedSystem(id);
      if (id === systemData.id) {
        setActiveTab("solar-system");
      } else {
        handleSystemChange(id);
      }
    },
    [systemData.id, handleSystemChange],
  );

  const handleGalaxySelectSystem = useCallback((id: string) => {
    setGalaxySelectedSystem(id);
    setGalaxySelectedRegion(null);
    setGalaxySelectedConstellation(null);
  }, []);

  const handleGalaxyHoverSystem = useCallback((id: string | null) => {
    setGalaxyHoveredSystem(id);
  }, []);

  const handleGalaxySelectRegion = useCallback((id: string | null) => {
    setGalaxySelectedRegion(id);
    setGalaxySelectedSystem(null);
  }, []);

  const handleGalaxySelectConstellation = useCallback((id: string | null) => {
    setGalaxySelectedConstellation(id);
    setGalaxySelectedSystem(null);
    setGalaxySelectedRegion(null);
  }, []);

  const handleZoomToSystem = useCallback((id: string) => {
    setGalaxySelectedSystem(id);
    setGalaxySelectedRegion(null);
    setGalaxySelectedConstellation(null);
    galaxyCanvasRef.current?.zoomToSystem(id);
  }, []);

  const isGalaxy = activeTab === "galaxy";

  return (
    <StarSystemContext.Provider value={systemData}>
      <div className="app">
        <header className="app-header">
          <div className="header-left">
            <div className="logo">
              <span className="logo-icon">◉</span>
              <span className="logo-text">Star Systems</span>
            </div>

            <div className="system-selector">
              <select
                className="system-select"
                value={systemData.id}
                onChange={(e) => handleSystemChange(e.target.value)}
                disabled={loadingSystem}
                title="Switch star system"
              >
                {STAR_SYSTEMS.filter((s) => s.navigable !== false).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {loadingSystem && <span className="system-loading">…</span>}
            </div>

            <div className="tab-bar">
              <button
                className={`tab-btn${activeTab === "galaxy" ? " active" : ""}`}
                onClick={() => handleTabChange("galaxy")}
              >
                <span className="tab-icon">✦</span>
                Galaxy
              </button>
              <button
                className={`tab-btn${activeTab === "solar-system" ? " active" : ""}`}
                onClick={() => handleTabChange("solar-system")}
              >
                <span className="tab-icon">🌌</span>
                System View
              </button>
              {!isGalaxy && (
                <button
                  className={`tab-btn${activeTab === "planet-view" ? " active" : ""}`}
                  onClick={() => handleTabChange("planet-view")}
                >
                  <span className="tab-icon">🪐</span>
                  Body View
                </button>
              )}
            </div>

            <div className="header-controls">
              {!isGalaxy && (
                <>
                  <button
                    className={`ctrl-btn${paused ? " active" : ""}`}
                    onClick={() => setPaused((p) => !p)}
                    title={paused ? "Resume" : "Pause"}
                  >
                    {paused ? "▶" : "⏸"}
                  </button>
                  <div className="speed-control">
                    <span className="ctrl-label">Speed</span>
                    <input
                      type="range"
                      min="0.1"
                      max="10"
                      step="0.1"
                      value={speed}
                      onChange={(e) => setSpeed(parseFloat(e.target.value))}
                      className="speed-slider"
                    />
                    <span className="speed-value">{speed.toFixed(1)}×</span>
                  </div>
                </>
              )}
              {activeTab === "solar-system" && (
                <>
                  <button
                    className={`ctrl-btn${showOrbits ? " active" : ""}`}
                    onClick={() => setShowOrbits((o) => !o)}
                  >
                    ⊙ Orbits
                  </button>
                  <button
                    className={`ctrl-btn${showLabels ? " active" : ""}`}
                    onClick={() => setShowLabels((l) => !l)}
                  >
                    ◫ Labels
                  </button>
                </>
              )}
              {activeTab === "planet-view" && (
                <button
                  className={`ctrl-btn${showLabels ? " active" : ""}`}
                  onClick={() => setShowLabels((l) => !l)}
                >
                  ◫ Labels
                </button>
              )}
            </div>
          </div>

          {activeTab === "solar-system" && trackedBody && (
            <div className="tracking-indicator">
              <span className="track-dot" />
              Tracking {systemData.bodies[trackedBody]?.name ?? trackedBody}
              <button
                className="untrack-btn"
                onClick={() => setTrackedBody(null)}
              >
                ✕
              </button>
            </div>
          )}
        </header>

        <main className="app-main">
          <aside className="left-panel">
            {isGalaxy ? (
              <GalaxyNavigator
                selectedSystem={galaxySelectedSystem}
                hoveredSystem={galaxyHoveredSystem}
                onSelectSystem={handleGalaxySelectSystem}
                onHoverSystem={handleGalaxyHoverSystem}
                onZoomToSystem={handleZoomToSystem}
                selectedConstellation={galaxySelectedConstellation}
                onSelectConstellation={handleGalaxySelectConstellation}
              />
            ) : (
              <BodyNavigator
                key={systemData.id}
                activeTab={activeTab}
                selectedBody={selectedBody}
                hoveredBody={hoveredBody}
                viewedPlanet={viewedPlanet}
                showingSystemPanel={showSystemPanel}
                onSelectBody={handleSelectBody}
                onHoverBody={handleHoverBody}
                onViewPlanet={handleViewPlanet}
                onGoToSolarSystem={handleGoToSolarSystem}
                onGoToGalaxy={handleGoToGalaxy}
                onSelectSystem={handleSelectSystem}
              />
            )}
          </aside>

          <div className="canvas-area">
            {activeTab === "solar-system" && (
              <SystemCanvas
                key={systemData.id}
                selectedBody={selectedBody}
                hoveredBody={hoveredBody}
                trackedBody={trackedBody}
                speed={speed}
                paused={paused}
                showOrbits={showOrbits}
                showLabels={showLabels}
                onSelectBody={handleSelectBody}
                onHoverBody={handleHoverBody}
                onTrackBody={handleTrackBody}
              />
            )}
            {activeTab === "galaxy" && (
              <GalaxyCanvas
                ref={galaxyCanvasRef}
                selectedSystem={galaxySelectedSystem}
                hoveredSystem={galaxyHoveredSystem}
                selectedRegion={galaxySelectedRegion}
                onSelectSystem={handleGalaxySelectSystem}
                onHoverSystem={handleGalaxyHoverSystem}
                onSelectRegion={handleGalaxySelectRegion}
                constellationSystemIds={constellationSystemIds}
              />
            )}
            {activeTab === "planet-view" && (
              <PlanetCanvas
                key={`${systemData.id}-${viewedPlanet}`}
                planetId={viewedPlanet}
                selectedBody={selectedBody}
                hoveredBody={hoveredBody}
                speed={speed}
                paused={paused}
                showLabels={showLabels}
                onSelectBody={handleSelectBody}
                onHoverBody={handleHoverBody}
              />
            )}
          </div>

          <aside className="right-panel">
            {isGalaxy || showSystemPanel ? (
              <GalaxySystemPanel
                systemId={isGalaxy ? galaxySelectedSystem : systemData.id}
                regionId={isGalaxy ? galaxySelectedRegion : null}
                constellationId={isGalaxy ? galaxySelectedConstellation : null}
                onExplore={handleExploreSystem}
                onSelectRegion={isGalaxy ? handleGalaxySelectRegion : undefined}
                onSelectSystem={isGalaxy ? handleGalaxySelectSystem : undefined}
                onZoomToSystem={isGalaxy ? handleZoomToSystem : undefined}
              />
            ) : (
              <InfoPanel selectedBody={selectedBody} />
            )}
          </aside>
        </main>
      </div>
    </StarSystemContext.Provider>
  );
}
