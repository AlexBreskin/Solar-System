import { useState, useCallback } from 'react';
import SolarSystemCanvas from './components/SolarSystemCanvas';
import PlanetViewCanvas from './components/PlanetViewCanvas';
import BodyNavigator from './components/BodyNavigator';
import InfoPanel from './components/InfoPanel';
import { CELESTIAL_BODIES } from './data/celestialBodies';
import type { BodyId, TabId } from './types';
import './App.css';

export default function App(): JSX.Element {
  const [activeTab, setActiveTab]       = useState<TabId>('solar-system');
  const [selectedBody, setSelectedBody] = useState<BodyId>('sun');
  const [hoveredBody, setHoveredBody]   = useState<BodyId | null>(null);
  const [trackedBody, setTrackedBody]   = useState<BodyId | null>(null);
  const [speed, setSpeed]               = useState<number>(1);
  const [paused, setPaused]             = useState<boolean>(false);
  const [showOrbits, setShowOrbits]     = useState<boolean>(true);
  const [showLabels, setShowLabels]     = useState<boolean>(false);
  const [viewedPlanet, setViewedPlanet] = useState<BodyId>('earth');

  const handleSelectBody = useCallback((id: BodyId) => {
    setSelectedBody(id);
    if (activeTab === 'solar-system') {
      if (CELESTIAL_BODIES[id]?.type === 'belt') setTrackedBody(null);
      else setTrackedBody(id);
    }
  }, [activeTab]);

  const handleHoverBody  = useCallback((id: BodyId | null) => setHoveredBody(id), []);

  const handleTrackBody  = useCallback((id: BodyId | null) => {
    setTrackedBody(prev => prev === id ? null : id);
    if (id) setSelectedBody(id);
  }, []);

  const handleViewPlanet = useCallback((id: BodyId) => {
    setViewedPlanet(id);
  }, []);

  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
    if (tab === 'planet-view') {
      const body = CELESTIAL_BODIES[selectedBody];
      if (body?.type === 'moon' && body.parent) {
        setViewedPlanet(body.parent);
      } else if (body && body.type !== 'belt') {
        setViewedPlanet(selectedBody);
      }
      setTrackedBody(null);
    }
  }, [selectedBody]);

  const handleGoToSolarSystem = useCallback(() => {
    setActiveTab('solar-system');
  }, []);

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
              className={`tab-btn${activeTab === 'solar-system' ? ' active' : ''}`}
              onClick={() => handleTabChange('solar-system')}
            >
              <span className="tab-icon">🌌</span>
              Solar System
            </button>
            <button
              className={`tab-btn${activeTab === 'planet-view' ? ' active' : ''}`}
              onClick={() => handleTabChange('planet-view')}
            >
              <span className="tab-icon">🪐</span>
              Planet View
            </button>
          </div>

          <div className="header-controls">
            <button
              className={`ctrl-btn${paused ? ' active' : ''}`}
              onClick={() => setPaused(p => !p)}
              title={paused ? 'Resume' : 'Pause'}
            >
              {paused ? '▶' : '⏸'}
            </button>
            <div className="speed-control">
              <span className="ctrl-label">Speed</span>
              <input
                type="range" min="0.1" max="10" step="0.1" value={speed}
                onChange={e => setSpeed(parseFloat(e.target.value))}
                className="speed-slider"
              />
              <span className="speed-value">{speed.toFixed(1)}×</span>
            </div>
            {activeTab === 'solar-system' && (
              <>
                <button
                  className={`ctrl-btn${showOrbits ? ' active' : ''}`}
                  onClick={() => setShowOrbits(o => !o)}
                >
                  ⊙ Orbits
                </button>
                <button
                  className={`ctrl-btn${showLabels ? ' active' : ''}`}
                  onClick={() => setShowLabels(l => !l)}
                >
                  ◫ Labels
                </button>
              </>
            )}
            {activeTab === 'planet-view' && (
              <button
                className={`ctrl-btn${showLabels ? ' active' : ''}`}
                onClick={() => setShowLabels(l => !l)}
              >
                ◫ Labels
              </button>
            )}
          </div>
        </div>

        {activeTab === 'solar-system' && trackedBody && (
          <div className="tracking-indicator">
            <span className="track-dot" />
            Tracking {CELESTIAL_BODIES[trackedBody]?.name ?? trackedBody}
            <button className="untrack-btn" onClick={() => setTrackedBody(null)}>✕</button>
          </div>
        )}
      </header>

      <main className="app-main">
        <aside className="left-panel">
          <BodyNavigator
            activeTab={activeTab}
            selectedBody={selectedBody}
            hoveredBody={hoveredBody}
            viewedPlanet={viewedPlanet}
            onSelectBody={handleSelectBody}
            onHoverBody={handleHoverBody}
            onViewPlanet={handleViewPlanet}
            onGoToSolarSystem={handleGoToSolarSystem}
          />
        </aside>

        <div className="canvas-area">
          {activeTab === 'solar-system' && (
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
          {activeTab === 'planet-view' && (
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
          <InfoPanel selectedBody={selectedBody} />
        </aside>
      </main>
    </div>
  );
}
