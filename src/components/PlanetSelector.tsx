import React from 'react';
import { CELESTIAL_BODIES } from '../data/celestialBodies';
import type { BodyId, PlanetSelectorProps } from '../types';
import './PlanetSelector.css';

const VIEWABLE_BODIES: BodyId[] = [
  'sun', 'mercury', 'venus', 'earth', 'mars', 'ceres',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
];

const MOON_COUNTS: Partial<Record<BodyId, number>> = {
  sun: 0, mercury: 0, venus: 0, earth: 1, mars: 2, ceres: 0,
  jupiter: 4, saturn: 2, uranus: 0, neptune: 1, pluto: 0,
};

export default function PlanetSelector({ planetId, onSelectPlanet }: PlanetSelectorProps): JSX.Element {
  return (
    <div className="planet-selector">
      <span className="ps-label">Viewing</span>
      <div className="ps-scroll">
        {VIEWABLE_BODIES.map(id => {
          const body = CELESTIAL_BODIES[id];
          const isActive = id === planetId;
          const moonCount = MOON_COUNTS[id] ?? 0;
          return (
            <button
              key={id}
              className={`ps-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectPlanet(id)}
              title={body.name}
            >
              <span className="ps-dot" style={{
                background: body.color,
                boxShadow: isActive ? `0 0 6px ${body.color}` : 'none',
              }} />
              <span className="ps-name">{body.name}</span>
              {moonCount > 0 && (
                <span className="ps-moons">{moonCount}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
