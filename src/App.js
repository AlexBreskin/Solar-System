import React, { useState, useCallback } from "react";
import SolarSystemCanvas from "./components/SolarSystemCanvas";
import PlanetViewCanvas from "./components/PlanetViewCanvas";
import PlanetSelector from "./components/PlanetSelector";
import Outliner from "./components/Outliner";
import InfoPanel from "./components/InfoPanel";
import { CELESTIAL_BODIES } from "./data/celestialBodies";
import "./App.css";

const MOON_PARENT_MAP = {
  moon: "earth",
  phobos: "mars",
  deimos: "mars",
  io: "jupiter",
  europa: "jupiter",
  ganymede: "jupiter",
  callisto: "jupiter",
  titan: "saturn",
  enceladus: "saturn",
  triton: "neptune",
};

function getBodiesForPlanet(planetId) {
  const moons = Object.entries(MOON_PARENT_MAP)
    .filter(([, p]) => p === planetId)
    .map(([id]) => id);
  return [planetId, ...moons];
}

export default function App() {
  const [activeTab, setActiveTab] = useState("solar-system");
  const [selectedBody, setSelectedBody] = useState("sun");
  const [hoveredBody, setHoveredBody] = useState(null);
  const [trackedBody, setTrackedBody] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showLabels, setShowLabels] = useState(false);
  const [viewedPlanet, setViewedPlanet] = useState("earth");

  const handleSelectBody = useCallback(
    (id) => {
      setSelectedBody(id);
      if (activeTab === "solar-system") setTrackedBody(id);
    },
    [activeTab],
  );

  const handleHoverBody = useCallback((id) => setHoveredBody(id), []);

  const handleTrackBody = useCallback((id) => {
    setTrackedBody((prev) => (prev === id ? null : id));
    if (id) setSelectedBody(id);
  }, []);

  const handleTabChange = useCallback(
    (tab) => {
      setActiveTab(tab);
      if (tab === "planet-view") {
        const body = CELESTIAL_BODIES[selectedBody];
        if (body) {
          if (
            body.type === "planet" ||
            body.type === "dwarf-planet" ||
            body.type === "star"
          ) {
            setViewedPlanet(selectedBody);
          } else if (body.parent && body.parent !== "sun") {
            setViewedPlanet(body.parent);
          } else if (body.parent === "sun") {
            setViewedPlanet(selectedBody);
          }
        }
        setTrackedBody(null);
      }
    },
    [selectedBody],
  );

  const handleSelectPlanet = useCallback((id) => {
    setViewedPlanet(id);
    setSelectedBody(id);
  }, []);

  const planetViewBodies =
    activeTab === "planet-view" ? getBodiesForPlanet(viewedPlanet) : null;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-left">
          <div className="logo">
            <span className="logo-icon">◉</span>
            <span className="logo-text">Solar System</span>
          </div>

          <div className="tab-bar">
            <button
              className={`tab-btn ${activeTab === "solar-system" ? "active" : ""}`}
              onClick={() => handleTabChange("solar-system")}
            >
              <span className="tab-icon">🌌</span>
              Solar System
            </button>
            <button
              className={`tab-btn ${activeTab === "planet-view" ? "active" : ""}`}
              onClick={() => handleTabChange("planet-view")}
            >
              <span className="tab-icon">🪐</span>
              Planet View
            </button>
          </div>

          <div className="header-controls">
            <button
              className={`ctrl-btn ${paused ? "active" : ""}`}
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
            {activeTab === "solar-system" && (
              <>
                <button
                  className={`ctrl-btn ${showOrbits ? "active" : ""}`}
                  onClick={() => setShowOrbits((o) => !o)}
                >
                  ⊙ Orbits
                </button>
                <button
                  className={`ctrl-btn ${showLabels ? "active" : ""}`}
                  onClick={() => setShowLabels((l) => !l)}
                >
                  ◫ Labels
                </button>
              </>
            )}
            {activeTab === "planet-view" && (
              <button
                className={`ctrl-btn ${showLabels ? "active" : ""}`}
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
            Tracking{" "}
            {trackedBody.charAt(0).toUpperCase() + trackedBody.slice(1)}
            <button
              className="untrack-btn"
              onClick={() => setTrackedBody(null)}
            >
              ✕
            </button>
          </div>
        )}
        {activeTab === "planet-view" && (
          <PlanetSelector
            planetId={viewedPlanet}
            onSelectPlanet={handleSelectPlanet}
          />
        )}
      </header>

      <main className="app-main">
        <div className="canvas-area">
          {activeTab === "solar-system" && (
            <SolarSystemCanvas
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
          {activeTab === "planet-view" && (
            <PlanetViewCanvas
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
          <Outliner
            selectedBody={selectedBody}
            hoveredBody={hoveredBody}
            onSelectBody={handleSelectBody}
            onHoverBody={handleHoverBody}
            filterIds={planetViewBodies}
          />
          <InfoPanel selectedBody={selectedBody} />
        </aside>
      </main>
    </div>
  );
}
