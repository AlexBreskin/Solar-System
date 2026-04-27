import { useCallback, useEffect, useRef, useState } from 'react';
import { useStarSystem } from '../contexts/StarSystemContext';
import type { BodyType, TabId, HierarchyNode } from '../types';
import './BodyNavigator.css';

const TYPE_ICONS: Record<BodyType, string> = {
  star: '☀',
  planet: '●',
  'dwarf-planet': '◎',
  moon: '○',
  asteroid: '·',
  belt: '⌀',
};

const TYPE_LABELS: Record<BodyType, string> = {
  star: 'Star',
  planet: 'Planet',
  'dwarf-planet': 'Dwarf Planet',
  moon: 'Moon',
  asteroid: 'Asteroid',
  belt: 'Region',
};

interface BodyNavigatorProps {
  activeTab: TabId;
  selectedBody: string;
  hoveredBody: string | null;
  viewedPlanet: string;
  onSelectBody: (id: string) => void;
  onHoverBody: (id: string | null) => void;
  onViewPlanet: (id: string) => void;
  onGoToSolarSystem: () => void;
}

interface NodeProps {
  node: HierarchyNode;
  depth: number;
  activeTab: TabId;
  selectedBody: string;
  hoveredBody: string | null;
  viewedPlanet: string;
  expandedIds: ReadonlySet<string>;
  bodies: ReturnType<typeof useStarSystem>['bodies'];
  onSelectBody: (id: string) => void;
  onHoverBody: (id: string | null) => void;
  onViewPlanet: (id: string) => void;
  onGoToSolarSystem: () => void;
  onToggle: (id: string) => void;
}

function NavigatorNode({
  node, depth, activeTab, selectedBody, hoveredBody, viewedPlanet,
  expandedIds, bodies, onSelectBody, onHoverBody, onViewPlanet, onGoToSolarSystem, onToggle,
}: NodeProps): JSX.Element | null {
  const body = bodies[node.id];
  if (!body) return null;

  const open       = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected  = selectedBody === node.id;
  const isHovered   = hoveredBody === node.id;
  const isViewed    = activeTab === 'planet-view' && node.id === viewedPlanet;

  const handleClick = () => {
    onSelectBody(node.id);
    if (activeTab === 'planet-view') {
      if (body.type === 'belt') {
        onGoToSolarSystem();
      } else if (body.type === 'moon' && body.parent) {
        onViewPlanet(body.parent);
      } else if (body.type !== 'star') {
        onViewPlanet(node.id);
      }
    }
  };

  return (
    <div className="nav-node">
      <div
        className={`nav-row${isSelected ? ' selected' : ''}${!isSelected && isViewed ? ' pv-viewed' : ''}${isHovered ? ' hovered' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        data-body-id={node.id}
        onClick={handleClick}
        onMouseEnter={() => onHoverBody(node.id)}
        onMouseLeave={() => onHoverBody(null)}
      >
        {hasChildren ? (
          <button
            className={`expand-btn${open ? ' open' : ''}`}
            onClick={e => { e.stopPropagation(); onToggle(node.id); }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >›</button>
        ) : (
          <span className="expand-spacer" />
        )}
        <span className="body-dot" style={{
          background: body.color,
          boxShadow: (isSelected || isViewed) ? `0 0 6px ${body.color}` : 'none',
        }} />
        <span className="body-icon" title={TYPE_LABELS[body.type]}>{TYPE_ICONS[body.type]}</span>
        <span className="body-name">{body.name}</span>
        <span className="body-type-badge">{TYPE_LABELS[body.type]}</span>
        {body.moons > 0 && (
          <span className="moon-count" title={`${body.moons} known moons`}>{body.moons}↑</span>
        )}
      </div>

      {hasChildren && open && (
        <div className="nav-children">
          {node.children.map(child => (
            <NavigatorNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeTab={activeTab}
              selectedBody={selectedBody}
              hoveredBody={hoveredBody}
              viewedPlanet={viewedPlanet}
              expandedIds={expandedIds}
              bodies={bodies}
              onSelectBody={onSelectBody}
              onHoverBody={onHoverBody}
              onViewPlanet={onViewPlanet}
              onGoToSolarSystem={onGoToSolarSystem}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function BodyNavigator({
  activeTab, selectedBody, hoveredBody, viewedPlanet,
  onSelectBody, onHoverBody, onViewPlanet, onGoToSolarSystem,
}: BodyNavigatorProps): JSX.Element {
  const { bodies, hierarchy, meta } = useStarSystem();

  const starId = Object.values(bodies).find(b => b.type === 'star')?.id;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(starId ? [starId] : []));
  const navScrollRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const body = bodies[selectedBody];
    if (body?.type === 'moon' && body.parent) {
      setExpandedIds(prev => {
        if (prev.has(body.parent!)) return prev;
        const next = new Set(prev);
        next.add(body.parent!);
        return next;
      });
    }
    const raf = requestAnimationFrame(() => {
      const el = navScrollRef.current?.querySelector(`[data-body-id="${selectedBody}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(raf);
  }, [selectedBody, bodies]);

  return (
    <div className="body-navigator">
      <div className="nav-header">
        <span className="nav-title">Celestial Bodies</span>
        <span className="nav-count">{Object.keys(bodies).length}</span>
      </div>
      <div className="nav-scroll" ref={navScrollRef}>

        <div className="nav-row pv-context-row" style={{ paddingLeft: 12 }}>
          <span className="expand-spacer" />
          <span className="body-icon">⬡</span>
          <span className="body-name">Milky Way</span>
          <span className="body-type-badge">Galaxy</span>
        </div>

        {activeTab === 'planet-view' ? (
          <div
            className="nav-row pv-context-row pv-system-row"
            style={{ paddingLeft: 24 }}
            onClick={onGoToSolarSystem}
            title="Back to system view"
          >
            <button className="expand-btn open" style={{ pointerEvents: 'none' }}>›</button>
            <span className="body-icon">⊙</span>
            <span className="body-name">{meta.name}</span>
            <span className="body-type-badge">System</span>
          </div>
        ) : (
          <div className="nav-row pv-context-row pv-system-active" style={{ paddingLeft: 24 }}>
            <button className="expand-btn open" style={{ pointerEvents: 'none' }}>›</button>
            <span className="body-icon">⊙</span>
            <span className="body-name">{meta.name}</span>
            <span className="body-type-badge">System</span>
          </div>
        )}

        {hierarchy.map(node => (
          <NavigatorNode
            key={node.id}
            node={node}
            depth={0}
            activeTab={activeTab}
            selectedBody={selectedBody}
            hoveredBody={hoveredBody}
            viewedPlanet={viewedPlanet}
            expandedIds={expandedIds}
            bodies={bodies}
            onSelectBody={onSelectBody}
            onHoverBody={onHoverBody}
            onViewPlanet={onViewPlanet}
            onGoToSolarSystem={onGoToSolarSystem}
            onToggle={toggleExpanded}
          />
        ))}
      </div>
    </div>
  );
}
