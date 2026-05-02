import { useMemo } from 'react';
import { STAR_SYSTEMS } from '../data/systems';
import { GALAXY_DATA, GALACTIC_IDS } from '../data/galaxy';
import { formatLY } from '../utils/distance';
import './GalaxySystemPanel.css';

interface GalaxySystemPanelProps {
  systemId: string | null;
  onExplore: (id: string) => void;
}

const ROOT_TYPE_LABELS: Record<string, string> = {
  star: 'Star System',
  'black-hole': 'Black Hole',
  'neutron-star': 'Neutron Star',
  quasar: 'Quasar',
};

const ROOT_TYPE_ICONS: Record<string, string> = {
  star: '☀',
  'black-hole': '◉',
  'neutron-star': '✶',
  quasar: '✵',
};

export default function GalaxySystemPanel({ systemId, onExplore }: GalaxySystemPanelProps): JSX.Element {
  const rootTypeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of GALAXY_DATA.systems) {
      map[entry.id] = entry.rootType;
    }
    for (const s of STAR_SYSTEMS) {
      if (!map[s.id]) map[s.id] = s.rootType ?? 'star';
    }
    return map;
  }, []);

  if (!systemId) {
    return (
      <div className="galaxy-system-panel galaxy-system-panel--empty">
        <span className="galaxy-system-panel__placeholder">Select a system to see details</span>
      </div>
    );
  }

  const meta = STAR_SYSTEMS.find(s => s.id === systemId);
  if (!meta) {
    return (
      <div className="galaxy-system-panel galaxy-system-panel--empty">
        <span className="galaxy-system-panel__placeholder">System not found</span>
      </div>
    );
  }

  const rootType = rootTypeById[systemId] ?? 'star';
  const rootTypeLabel = ROOT_TYPE_LABELS[rootType] ?? 'Star System';
  const rootTypeIcon = ROOT_TYPE_ICONS[rootType] ?? '☀';
  const isExtragalactic = !GALACTIC_IDS.has(systemId);

  return (
    <div className="galaxy-system-panel">
      <div className="gsp-header">
        <span className={`gsp-type-badge gsp-type-badge--${rootType}`}>
          <span className="gsp-type-icon">{rootTypeIcon}</span>
          {rootTypeLabel}
        </span>
      </div>
      <div className="gsp-name">{meta.name}</div>
      {meta.distanceFromEarth !== undefined && meta.distanceFromEarth > 0 && (
        <div className="gsp-distance">
          <span className="gsp-distance-label">Distance from Earth</span>
          <span className="gsp-distance-value">{formatLY(meta.distanceFromEarth)}</span>
        </div>
      )}
      {meta.description && (
        <p className="gsp-description">{meta.description}</p>
      )}
      {isExtragalactic && (
        <p className="gsp-note">Beyond the Milky Way — not visible on the galaxy map.</p>
      )}
      <button
        className="gsp-explore-btn"
        onClick={() => onExplore(systemId)}
      >
        Explore System →
      </button>
    </div>
  );
}
