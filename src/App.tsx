import { useState, useCallback } from "react";
import BodyNavigator from "@/components/system-view/BodyNavigator";
import GalaxyNavigator from "@/components/galaxy-view/GalaxyNavigator";
import HeaderControls from "@/components/app/HeaderControls";
import CanvasArea from "@/components/app/CanvasArea";
import RightPanel from "@/components/app/RightPanel";
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
import type { TabId, StarSystemMeta } from "@/types";
import { useGalaxyState } from "@/hooks/useGalaxyState";
import { useBodySelection } from "@/hooks/useBodySelection";
import { useSystemNavigation } from "@/hooks/useSystemNavigation";
import { getPlanetViewId } from "@/utils/getPlanetViewId";
import "./App.css";

function tabClass(activeTab: TabId, tab: TabId): string {
  return `tab-btn${activeTab === tab ? " active" : ""}`;
}

const navigableSystems = STAR_SYSTEMS.filter((s) => s.navigable !== false);

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
  const [activeTab, setActiveTab] = useState<TabId>("solar-system");
  const [systemData, setSystemData] =
    useState<StarSystemData>(defaultSystemData);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const galaxy = useGalaxyState(defaultSystemData.id);

  const {
    selectedBody,
    hoveredBody,
    trackedBody,
    viewedPlanet,
    showSystemPanel,
    setTrackedBody,
    setViewedPlanet,
    setShowSystemPanel,
    resetForNewSystem,
    handleSelectBody,
    handleHoverBody,
    handleTrackBody,
    handleViewPlanet,
  } = useBodySelection(activeTab, systemData.bodies);

  const { loadingSystem, handleSystemChange, handleExploreSystem } =
    useSystemNavigation(
      systemData.id,
      setSystemData,
      galaxy.selectSystem,
      setActiveTab,
      resetForNewSystem,
    );

  const handleTabChange = useCallback(
    (tab: TabId) => {
      setActiveTab(tab);
      if (tab === "planet-view") {
        const planetId = getPlanetViewId(selectedBody, systemData.bodies);
        if (planetId) setViewedPlanet(planetId);
        setTrackedBody(null);
      }
    },
    [selectedBody, systemData.bodies, setViewedPlanet, setTrackedBody],
  );

  const handleGoToSolarSystem = useCallback(
    () => setActiveTab("solar-system"),
    [],
  );
  const handleGoToGalaxy = useCallback(() => setActiveTab("galaxy"), []);
  const handleSelectSystem = useCallback(() => {
    setShowSystemPanel(true);
    setTrackedBody(null);
  }, [setShowSystemPanel, setTrackedBody]);

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
                {navigableSystems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {loadingSystem && <span className="system-loading">…</span>}
            </div>

            <div className="tab-bar">
              <button
                className={tabClass(activeTab, "galaxy")}
                onClick={() => handleTabChange("galaxy")}
              >
                <span className="tab-icon">✦</span>
                Galaxy
              </button>
              <button
                className={tabClass(activeTab, "solar-system")}
                onClick={() => handleTabChange("solar-system")}
              >
                <span className="tab-icon">🌌</span>
                System View
              </button>
              {!isGalaxy && (
                <button
                  className={tabClass(activeTab, "planet-view")}
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
