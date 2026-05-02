import { useMemo } from 'react';
import { STAR_SYSTEMS } from '../data/systems';
import { GALAXY_DATA, GALACTIC_IDS } from '../data/galaxy';
import type { StarSystemMeta } from '../types';
import './GalaxyNavigator.css';

interface GalaxyNavigatorProps {
  selectedSystem: string | null;
  hoveredSystem: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
}

const ROOT_TYPE_ICONS: Record<string, string> = {
  star: '☀',
  'black-hole': '◉',
  'neutron-star': '✶',
  quasar: '✵',
};

const ROOT_TYPE_LABELS: Record<string, string> = {
  star: 'Star System',
  'black-hole': 'Black Hole',
  'neutron-star': 'Neutron Star',
  quasar: 'Quasar',
};

function SystemRow({
  s,
  rootType,
  isSelected,
  isHovered,
  onSelectSystem,
  onHoverSystem,
}: {
  s: StarSystemMeta;
  rootType: string;
  isSelected: boolean;
  isHovered: boolean;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
}): JSX.Element {
  return (
    <div
      className={`gnav-row${isSelected ? ' selected' : ''}${isHovered ? ' hovered' : ''}`}
      onClick={() => onSelectSystem(s.id)}
      onMouseEnter={() => onHoverSystem(s.id)}
      onMouseLeave={() => onHoverSystem(null)}
    >
      <span className="gnav-dot" style={{ background: s.starColor }} />
      <span className="gnav-icon" title={ROOT_TYPE_LABELS[rootType] ?? 'Star System'}>
        {ROOT_TYPE_ICONS[rootType] ?? '☀'}
      </span>
      <span className="gnav-name">{s.name}</span>
      <span className="gnav-badge">{ROOT_TYPE_LABELS[rootType] ?? 'Star System'}</span>
    </div>
  );
}

export default function GalaxyNavigator({
  selectedSystem,
  hoveredSystem,
  onSelectSystem,
  onHoverSystem,
}: GalaxyNavigatorProps): JSX.Element {
  const rootTypeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of GALAXY_DATA.systems) map[entry.id] = entry.rootType;
    for (const s of STAR_SYSTEMS) {
      if (!map[s.id]) map[s.id] = s.rootType ?? 'star';
    }
    return map;
  }, []);

  const { galactic, extragalactic } = useMemo(() => {
    const byDist = (a: StarSystemMeta, b: StarSystemMeta) =>
      (a.distanceFromEarth ?? 0) - (b.distanceFromEarth ?? 0);
    return {
      galactic: STAR_SYSTEMS.filter(s => GALACTIC_IDS.has(s.id)).sort(byDist),
      extragalactic: STAR_SYSTEMS.filter(s => !GALACTIC_IDS.has(s.id)).sort(byDist),
    };
  }, []);

  return (
    <div className="gnav">
      <div className="gnav-header">
        <span className="gnav-title">Star Systems</span>
        <span className="gnav-count">{STAR_SYSTEMS.length}</span>
      </div>
      <div className="gnav-scroll">
        <div className="gnav-section">Milky Way</div>
        {galactic.map(s => (
          <SystemRow
            key={s.id}
            s={s}
            rootType={rootTypeById[s.id] ?? 'star'}
            isSelected={selectedSystem === s.id}
            isHovered={hoveredSystem === s.id}
            onSelectSystem={onSelectSystem}
            onHoverSystem={onHoverSystem}
          />
        ))}
        <div className="gnav-section gnav-section--extra">Beyond the Milky Way</div>
        {extragalactic.map(s => (
          <SystemRow
            key={s.id}
            s={s}
            rootType={rootTypeById[s.id] ?? 'star'}
            isSelected={selectedSystem === s.id}
            isHovered={hoveredSystem === s.id}
            onSelectSystem={onSelectSystem}
            onHoverSystem={onHoverSystem}
          />
        ))}
      </div>
    </div>
  );
}
