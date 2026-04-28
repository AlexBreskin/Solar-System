import { useState, useCallback } from 'react';
import SolarSystemCanvas from './components/SolarSystemCanvas';
import PlanetViewCanvas from './components/PlanetViewCanvas';
import BodyNavigator from './components/BodyNavigator';
import InfoPanel from './components/InfoPanel';
import { loadStarSystem } from './data/celestialBodies';
import { STAR_SYSTEMS } from './data/systems';
import { StarSystemContext, type StarSystemData } from './contexts/StarSystemContext';
import { CELESTIAL_BODIES, BODY_HIERARCHY, VISUAL_CONFIG } from './data/celestialBodies';
import { BodyType } from './types';
import type { BodyId, TabId, StarSystemMeta } from './types';
import './App.css';

const defaultSystemData: StarSystemData = {
  id: 'sol',
  meta: STAR_SYSTEMS.find(s => s.id === 'sol') ?? {
    id: 'sol', name: 'Solar System',
    description: 'Our home system — 8 planets, 5 dwarf planets, and two asteroid belts orbiting the Sun.',
    starColor: '#FDB813', displayOrder: 0,
  } as StarSystemMeta,
  bodies: CELESTIAL_BODIES,
  hierarchy: BODY_HIERARCHY,
  visualConfig: VISUAL_CONFIG,
};

export default function App(): JSX.Element {
  const [systemData, setSystemData]     = useState<StarSystemData>(defaultSystemData);
  const [loadingSystem, setLoadingSystem] = useState(false);
  const [activeTab, setActiveTab]       = useState<TabId>('solar-system');
  const [selectedBody, setSelectedBody] = useState<BodyId>('sun');
  const [hoveredBody, setHoveredBody]   = useState<BodyId | null>(null);
  const [trackedBody, setTrackedBody]   = useState<BodyId | null>(null);
  const [speed, setSpeed]               = useState<number>(1);
  const [paused, setPaused]             = useState<boolean>(false);
  const [showOrbits, setShowOrbits]     = useState<boolean>(true);
  const [showLabels, setShowLabels]     = useState<boolean>(false);
  const [viewedPlanet, setViewedPlanet] = useState<BodyId>('earth');

  const handleSystemChange = useCallback((id: string) => {
    if (id === systemData.id) return;
    setLoadingSystem(true);
    loadStarSystem(id).then(loaded => {
      const starId = Object.values(loaded.bodies).find(b => b.type === BodyType.Star)?.id ?? id;
      setSystemData(loaded);
      setSelectedBody(starId);
      setHoveredBody(null);
      setTrackedBody(null);
      setViewedPlanet(starId);
      setActiveTab('solar-system');
      setLoadingSystem(false);
    }).catch(() => setLoadingSystem(false));
  }, [systemData.id]);

  const handleSelectBody = useCallback((id: BodyId) => {
    setSelectedBody(id);
    if (activeTab === 'solar-system') {
      if (systemData.bodies[id]?.type === BodyType.Belt) setTrackedBody(null);
      else setTrackedBody(id);
    }
  }, [activeTab, systemData.bodies]);

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
      const body = systemData.bodies[selectedBody];
      if ((body?.type === BodyType.Moon || body?.type === BodyType.Companion) && body.parent) {
        setViewedPlanet(body.parent);
      } else if (body && body.type !== BodyType.Belt) {
        setViewedPlanet(selectedBody);
      }
      setTrackedBody(null);
    }
  }, [selectedBody, systemData.bodies]);

  const handleGoToSolarSystem = useCallback(() => {
    setActiveTab('solar-system');
  }, []);

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
                onChange={e => handleSystemChange(e.target.value)}
                disabled={loadingSystem}
                title="Switch star system"
              >
                {STAR_SYSTEMS.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {loadingSystem && <span className="system-loading">…</span>}
            </div>

            <div className="tab-bar">
              <button
                className={`tab-btn${activeTab === 'solar-system' ? ' active' : ''}`}
                onClick={() => handleTabChange('solar-system')}
              >
                <span className="tab-icon">🌌</span>
                System View
              </button>
              <button
                className={`tab-btn${activeTab === 'planet-view' ? ' active' : ''}`}
                onClick={() => handleTabChange('planet-view')}
              >
                <span className="tab-icon">🪐</span>
                Body View
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
              Tracking {systemData.bodies[trackedBody]?.name ?? trackedBody}
              <button className="untrack-btn" onClick={() => setTrackedBody(null)}>✕</button>
            </div>
          )}
        </header>

        <main className="app-main">
          <aside className="left-panel">
            <BodyNavigator
              key={systemData.id}
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
            {activeTab === 'planet-view' && (
              <PlanetViewCanvas
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
            <InfoPanel selectedBody={selectedBody} />
          </aside>
        </main>
      </div>
    </StarSystemContext.Provider>
  );
}
