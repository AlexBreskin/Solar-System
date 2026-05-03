import { useCallback, useEffect, useRef, useState } from "react";
import { useStarSystem } from "../contexts/StarSystemContext";
import { BodyType, ROOT_BODY_TYPES } from "../types";
import { GALACTIC_IDS } from "../data/galaxy";
import type { TabId, HierarchyNode } from "../types";
import "./BodyNavigator.css";

const TYPE_ICONS: Record<BodyType, string> = {
  [BodyType.Star]: "☀",
  [BodyType.Planet]: "●",
  [BodyType.DwarfPlanet]: "◎",
  [BodyType.Moon]: "○",
  [BodyType.Asteroid]: "·",
  [BodyType.Belt]: "⌀",
  [BodyType.Companion]: "✦",
  [BodyType.BlackHole]: "◉",
  [BodyType.NeutronStar]: "✶",
  [BodyType.Quasar]: "✵",
};

const TYPE_LABELS: Record<BodyType, string> = {
  [BodyType.Star]: "Star",
  [BodyType.Planet]: "Planet",
  [BodyType.DwarfPlanet]: "Dwarf Planet",
  [BodyType.Moon]: "Moon",
  [BodyType.Asteroid]: "Asteroid",
  [BodyType.Belt]: "Region",
  [BodyType.Companion]: "Companion Star",
  [BodyType.BlackHole]: "Black Hole",
  [BodyType.NeutronStar]: "Neutron Star",
  [BodyType.Quasar]: "Quasar",
};

interface BodyNavigatorProps {
  activeTab: TabId;
  selectedBody: string;
  hoveredBody: string | null;
  viewedPlanet: string;
  showingSystemPanel: boolean;
  onSelectBody: (id: string) => void;
  onHoverBody: (id: string | null) => void;
  onViewPlanet: (id: string) => void;
  onGoToSolarSystem: () => void;
  onGoToGalaxy: () => void;
  onSelectSystem: () => void;
}

interface NodeProps {
  node: HierarchyNode;
  depth: number;
  activeTab: TabId;
  selectedBody: string;
  hoveredBody: string | null;
  viewedPlanet: string;
  expandedIds: ReadonlySet<string>;
  bodies: ReturnType<typeof useStarSystem>["bodies"];
  onSelectBody: (id: string) => void;
  onHoverBody: (id: string | null) => void;
  onViewPlanet: (id: string) => void;
  onGoToSolarSystem: () => void;
  onToggle: (id: string) => void;
}

function NavigatorNode({
  node,
  depth,
  activeTab,
  selectedBody,
  hoveredBody,
  viewedPlanet,
  expandedIds,
  bodies,
  onSelectBody,
  onHoverBody,
  onViewPlanet,
  onGoToSolarSystem,
  onToggle,
}: NodeProps): JSX.Element | null {
  const body = bodies[node.id];
  if (!body) return null;

  const open = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedBody === node.id;
  const isHovered = hoveredBody === node.id;
  const isViewed = activeTab === "planet-view" && node.id === viewedPlanet;

  const handleClick = () => {
    onSelectBody(node.id);
    if (activeTab === "planet-view") {
      if (body.type === BodyType.Belt) {
        onGoToSolarSystem();
      } else if (
        (body.type === BodyType.Moon || body.type === BodyType.Companion) &&
        body.parent
      ) {
        onViewPlanet(body.parent);
      } else if (!ROOT_BODY_TYPES.has(body.type)) {
        onViewPlanet(node.id);
      }
    }
  };

  return (
    <div className="nav-node">
      <div
        className={`nav-row${isSelected ? " selected" : ""}${!isSelected && isViewed ? " pv-viewed" : ""}${isHovered ? " hovered" : ""}`}
        style={{ paddingLeft: 28 + depth * 16 }}
        data-body-id={node.id}
        onClick={handleClick}
        onMouseEnter={() => onHoverBody(node.id)}
        onMouseLeave={() => onHoverBody(null)}
      >
        {hasChildren ? (
          <button
            className={`expand-btn${open ? " open" : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            aria-label={open ? "Collapse" : "Expand"}
          >
            ›
          </button>
        ) : (
          <span className="expand-spacer" />
        )}
        <span
          className="body-dot"
          style={{
            background: body.color,
            boxShadow:
              isSelected || isViewed ? `0 0 6px ${body.color}` : "none",
          }}
        />
        <span className="body-icon" title={TYPE_LABELS[body.type]}>
          {TYPE_ICONS[body.type]}
        </span>
        <span className="body-name">{body.name}</span>
        <span className="body-type-badge">{TYPE_LABELS[body.type]}</span>
        {body.moons > 0 && (
          <span className="moon-count" title={`${body.moons} known moons`}>
            {body.moons}↑
          </span>
        )}
      </div>

      {hasChildren && open && (
        <div className="nav-children">
          {node.children.map((child) => (
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
  activeTab,
  selectedBody,
  hoveredBody,
  viewedPlanet,
  showingSystemPanel,
  onSelectBody,
  onHoverBody,
  onViewPlanet,
  onGoToSolarSystem,
  onGoToGalaxy,
  onSelectSystem,
}: BodyNavigatorProps): JSX.Element {
  const { bodies, hierarchy, meta } = useStarSystem();

  const starId = Object.values(bodies).find((b) =>
    ROOT_BODY_TYPES.has(b.type),
  )?.id;
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(starId ? [starId] : []),
  );
  const navScrollRef = useRef<HTMLDivElement>(null);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    const body = bodies[selectedBody];
    if (body?.type === BodyType.Moon && body.parent) {
      setExpandedIds((prev) => {
        if (prev.has(body.parent!)) return prev;
        const next = new Set(prev);
        next.add(body.parent!);
        return next;
      });
    }
    const raf = requestAnimationFrame(() => {
      const el = navScrollRef.current?.querySelector(
        `[data-body-id="${selectedBody}"]`,
      );
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
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
        {GALACTIC_IDS.has(meta.id) ? (
          <div
            className={`nav-row pv-galaxy-row${activeTab === "galaxy" ? " pv-system-active" : ""}`}
            style={{ paddingLeft: 12 }}
            onClick={onGoToGalaxy}
            title="Galaxy view"
          >
            <span className="expand-spacer" />
            <span className="body-icon">⬡</span>
            <span className="body-name">Milky Way</span>
            <span className="body-type-badge">Galaxy</span>
          </div>
        ) : (
          <div
            className="nav-row pv-context-row"
            style={{ paddingLeft: 12 }}
            title="Host galaxy — not yet navigable"
          >
            <span className="expand-spacer" />
            <span className="body-icon">⬡</span>
            <span className="body-name">
              {meta.hostGalaxy ?? "Unknown galaxy"}
            </span>
            <span className="body-type-badge">Galaxy</span>
          </div>
        )}

        <div
          className={`nav-row pv-system-hierarchy${showingSystemPanel ? " selected" : ""}`}
          style={{ paddingLeft: 24 }}
          onClick={onSelectSystem}
          title="System information"
        >
          <span className="expand-spacer" />
          <span className="body-icon">⊙</span>
          <span className="body-name">{meta.name}</span>
          <span className="body-type-badge">System</span>
        </div>

        {hierarchy.map((node) => (
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
