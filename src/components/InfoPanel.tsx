import React from 'react';
import { CELESTIAL_BODIES } from '../data/celestialBodies';
import type { BodyType, InfoPanelProps, StatRowProps } from '../types';
import './InfoPanel.css';

const TYPE_LABELS: Record<BodyType, string> = {
  star: 'Star',
  planet: 'Planet',
  'dwarf-planet': 'Dwarf Planet',
  moon: 'Moon',
  asteroid: 'Asteroid',
  belt: 'Region',
};

function StatRow({ label, value }: StatRowProps): JSX.Element | null {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

function formatPeriod(days: number): string {
  if (!days) return '—';
  const absDays = Math.abs(days);
  const retro = days < 0 ? ' (retrograde)' : '';
  if (absDays < 1) return `${(absDays * 24).toFixed(1)} hours${retro}`;
  if (absDays < 365) return `${absDays.toFixed(2)} days${retro}`;
  const years = absDays / 365.25;
  if (years < 100) return `${years.toFixed(2)} years${retro}`;
  return `${Math.round(years).toLocaleString()} years${retro}`;
}

function formatDistance(au: number): string {
  if (!au) return '—';
  if (au < 0.001) return `${(au * 1.496e8).toFixed(0)} km`;
  if (au < 0.1) return `${(au * 1.496e8 / 1000).toFixed(0)} thousand km`;
  return `${au.toFixed(3)} AU`;
}

function formatDiameter(km: number): string {
  if (!km) return '—';
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${km.toLocaleString()} km`;
}

export default function InfoPanel({ selectedBody }: InfoPanelProps): JSX.Element {
  const body = CELESTIAL_BODIES[selectedBody];
  if (!body) return <div className="info-panel empty">Select a body</div>;

  const isRetrograde = body.rotationPeriod < 0;

  return (
    <div className="info-panel">
      <div className="info-header">
        <div className="info-dot-wrap">
          <div className="info-dot" style={{ background: body.color, boxShadow: `0 0 16px ${body.glowColor ?? body.color}80` }} />
          {body.id === 'sun' && <div className="sun-pulse" style={{ borderColor: body.color }} />}
        </div>
        <div className="info-title-block">
          <div className="info-name">{body.name}</div>
          <div className="info-type">{TYPE_LABELS[body.type]}</div>
        </div>
      </div>

      {body.parent && (
        <div className="info-parent">
          Orbiting <span>{CELESTIAL_BODIES[body.parent]?.name ?? body.parent}</span>
        </div>
      )}

      <p className="info-description">{body.description}</p>

      <div className="info-section">
        <div className="info-section-title">Physical</div>
        <StatRow label="Diameter" value={formatDiameter(body.diameter)} />
        <StatRow label="Mass" value={body.mass} />
        <StatRow label="Temperature" value={body.surfaceTemp} />
        {body.moons > 0 && <StatRow label="Known Moons" value={body.moons} />}
      </div>

      <div className="info-section">
        <div className="info-section-title">Orbital</div>
        <StatRow label="Distance" value={formatDistance(body.distanceFromParent)} />
        <StatRow label="Orbital Period" value={formatPeriod(body.orbitalPeriod)} />
        <StatRow label="Rotation Period" value={formatPeriod(body.rotationPeriod)} />
        <StatRow label="Eccentricity" value={body.eccentricity?.toFixed(3)} />
        <StatRow label="Inclination" value={body.inclination != null ? `${body.inclination}°` : null} />
        {isRetrograde && <div className="retrograde-tag">⟲ Retrograde rotation</div>}
      </div>

      {body.atmosphere && (
        <div className="info-section">
          <div className="info-section-title">Atmosphere</div>
          <div className="atmo-text">{body.atmosphere}</div>
        </div>
      )}

      <div className="info-funfact">
        <div className="funfact-label">★ Did you know?</div>
        <div className="funfact-text">{body.funFact}</div>
      </div>
    </div>
  );
}
