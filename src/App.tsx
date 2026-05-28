import { useState, useCallback } from "react";
import BodyNavigator from "@/components/system-view/BodyNavigator";
import GalaxyNavigator from "@/components/galaxy-view/GalaxyNavigator";
import HeaderControls from "@/components/app/HeaderControls";
import CanvasArea from "@/components/app/CanvasArea";
import RightPanel from "@/components/app/RightPanel";
import { loadStarSystem } from "@/data/celestialBodies";
import { STAR_SYSTEMS } from "@/data/systems";
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
import { useGalaxyState } from "@/hooks/useGalaxyState";
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

function getPlanetViewId(
  selectedBody: BodyId,
  bodies: StarSystemData["bodies"],
): BodyId | null {
  const body = bodies[selectedBody];
  if (
    (body?.type === BodyType.Moon || body?.type === BodyType.Companion) &&
    body.parent
  ) {
    return body.parent as BodyId;
  }
  if (body && body.type !== BodyType.Belt) return selectedBody;
  return null;
}

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
  const [showSystemPanel, setShowSystemPanel] = useState<boolean>(false);
  const galaxy = useGalaxyState(defaultSystemData.id);

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
          galaxy.selectSystem(id);
          setSelectedBody(starId);
          setHoveredBody(null);
          setTrackedBody(null);
          setViewedPlanet(starId);
          setActiveTab("solar-system");
          setLoadingSystem(false);
        })
        .catch(() => setLoadingSystem(false));
    },
    [systemData.id, galaxy.selectSystem],
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
        const planetId = getPlanetViewId(selectedBody, systemData.bodies);
        if (planetId) setViewedPlanet(planetId);
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
      galaxy.selectSystem(id);
      if (id === systemData.id) {
        setActiveTab("solar-system");
      } else {
        handleSystemChange(id);
      }
    },
    [systemData.id, handleSystemChange, galaxy.selectSystem],
  );

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

            <HeaderControls
              isGalaxy={isGalaxy}
              activeTab={activeTab}
              paused={paused}
              speed={speed}
              showOrbits={showOrbits}
              showLabels={showLabels}
              onTogglePause={() => setPaused((p) => !p)}
              onSpeedChange={setSpeed}
              onToggleOrbits={() => setShowOrbits((o) => !o)}
              onToggleLabels={() => setShowLabels((l) => !l)}
            />
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
                selectedSystem={galaxy.selectedSystem}
                hoveredSystem={galaxy.hoveredSystem}
                onSelectSystem={galaxy.selectSystem}
                onHoverSystem={galaxy.hoverSystem}
                onZoomToSystem={galaxy.zoomToSystem}
                selectedConstellation={galaxy.selectedConstellation}
                onSelectConstellation={galaxy.selectConstellation}
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
            <CanvasArea
              activeTab={activeTab}
              systemDataId={systemData.id}
              selectedBody={selectedBody}
              hoveredBody={hoveredBody}
              trackedBody={trackedBody}
              speed={speed}
              paused={paused}
              showOrbits={showOrbits}
              showLabels={showLabels}
              viewedPlanet={viewedPlanet}
              galaxyCanvasRef={galaxy.canvasRef}
              galaxySelectedSystem={galaxy.selectedSystem}
              galaxyHoveredSystem={galaxy.hoveredSystem}
              galaxySelectedRegion={galaxy.selectedRegion}
              constellationSystemIds={galaxy.constellationSystemIds}
              onSelectBody={handleSelectBody}
              onHoverBody={handleHoverBody}
              onTrackBody={handleTrackBody}
              onGalaxySelectSystem={galaxy.selectSystem}
              onGalaxyHoverSystem={galaxy.hoverSystem}
              onGalaxySelectRegion={galaxy.selectRegion}
            />
          </div>

          <aside className="right-panel">
            <RightPanel
              isGalaxy={isGalaxy}
              showSystemPanel={showSystemPanel}
              selectedSystem={galaxy.selectedSystem}
              selectedRegion={galaxy.selectedRegion}
              selectedConstellation={galaxy.selectedConstellation}
              systemDataId={systemData.id}
              selectedBody={selectedBody}
              onExplore={handleExploreSystem}
              onSelectRegion={galaxy.selectRegion}
              onSelectSystem={galaxy.selectSystem}
              onZoomToSystem={galaxy.zoomToSystem}
            />
          </aside>
        </main>
      </div>
    </StarSystemContext.Provider>
  );
}
