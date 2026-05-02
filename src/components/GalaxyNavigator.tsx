import { useMemo } from 'react';
import { STAR_SYSTEMS } from '../data/systems';
import { GALAXY_DATA } from '../data/galaxy';
import { EXTRAGALACTIC_IDS } from '../types';
import { formatLY } from '../utils/distance';
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

function rootTypeIcon(rootType: string): string {
  return ROOT_TYPE_ICONS[rootType] ?? '☀';
}

export default function GalaxyNavigator({
  selectedSystem,
  hoveredSystem,
  onSelectSystem,
  onHoverSystem,
}: GalaxyNavigatorProps): JSX.Element {
  const rootTypeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of GALAXY_DATA.systems) {
      map[entry.id] = entry.rootType;
    }
    for (const id of EXTRAGALACTIC_IDS) {
      if (!map[id]) map[id] = 'quasar';
    }
    return map;
  }, []);

  const sortedSystems = useMemo(() => {
    return [...STAR_SYSTEMS].sort((a, b) => (a.distanceFromEarth ?? 0) - (b.distanceFromEarth ?? 0));
  }, []);

  return (
    <div className="galaxy-navigator">
      <div className="galaxy-nav-header">
        <span className="galaxy-nav-title">Star Systems</span>
        <span className="galaxy-nav-count">{STAR_SYSTEMS.length}</span>
      </div>
      <div className="galaxy-nav-scroll">
        {sortedSystems.map(s => {
          const isSelected = selectedSystem === s.id;
          const isHovered = hoveredSystem === s.id;
          const isExtragalactic = EXTRAGALACTIC_IDS.has(s.id);
          const rootType = rootTypeById[s.id] ?? 'star';
          return (
            <div
              key={s.id}
              className={`galaxy-nav-row${isSelected ? ' selected' : ''}${isHovered ? ' hovered' : ''}${isExtragalactic ? ' extragalactic' : ''}`}
              onClick={() => onSelectSystem(s.id)}
              onMouseEnter={() => onHoverSystem(s.id)}
              onMouseLeave={() => onHoverSystem(null)}
            >
              <span className="galaxy-nav-icon">{rootTypeIcon(rootType)}</span>
              <span className="galaxy-nav-name">{s.name}</span>
              <span className="galaxy-nav-dist">
                {s.distanceFromEarth ? formatLY(s.distanceFromEarth) : '—'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
