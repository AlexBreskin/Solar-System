import { useMemo, useState, type ReactNode } from "react";
import { STAR_SYSTEMS } from "../data/systems";
import { GALAXY_DATA, GALACTIC_IDS, GALAXY_REGIONS } from "../data/galaxy";
import { CONSTELLATIONS } from "../data/constellations";
import type { GalacticArmHint, ConstellationOutline } from "../types/galaxy";
import { formatLY } from "../utils/distance";
import "./GalaxySystemPanel.css";

const ARROW_SVG = (
  <svg
    className="ext-arrow"
    viewBox="0 0 10 10"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 8L8 2M8 2H4M8 2V6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function ExternalLink({
  href,
  badge,
  label,
}: {
  href: string | undefined;
  badge: ReactNode;
  label: string;
}): JSX.Element {
  if (href) {
    return (
      <a
        className="ext-link ext-link-active"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {badge}
        <span className="ext-link-label">{label}</span>
        {ARROW_SVG}
      </a>
    );
  }
  return (
    <span className="ext-link ext-link-none">
      {badge}
      <span className="ext-link-label">Not available</span>
    </span>
  );
}

function renderArmHint(
  hint: GalacticArmHint,
  onSelectRegion: ((id: string) => void) | undefined,
): JSX.Element {
  const name = ARM_DISPLAY_NAMES[hint];
  if (onSelectRegion) {
    return (
      <button
        className="gsp-arm-hint gsp-arm-hint--clickable"
        onClick={() => onSelectRegion(hint)}
        title={`View ${name} region details`}
      >
        {name} ›
      </button>
    );
  }
  return <div className="gsp-arm-hint">{name}</div>;
}

const ARM_DISPLAY_NAMES: Record<GalacticArmHint, string> = {
  orion: "Orion Spur",
  sagittarius: "Carina–Sagittarius Arm",
  scutum: "Scutum–Centaurus Arm",
  norma: "Norma Arm",
  perseus: "Perseus Arm",
  outer: "Outer Arm",
  core: "Galactic Centre",
  halo: "Galactic Halo",
};

const SYSTEM_COLORS: Record<string, string> = {};
for (const s of STAR_SYSTEMS) SYSTEM_COLORS[s.id] = s.starColor;

function starRadius(mag: number = 3.5): number {
  return Math.max(0.8, 3.5 - mag * 0.4);
}

function ConstellationDiagram({
  outline,
  onSelectSystem,
  onZoomToSystem,
}: {
  outline: ConstellationOutline;
  onSelectSystem?: (id: string) => void;
  onZoomToSystem?: (id: string) => void;
}): JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const tooltip =
    hoveredIdx !== null
      ? (() => {
          const star = outline.stars[hoveredIdx];
          const r = starRadius(star.mag);
          const name = star.name;
          const tWidth = Math.max(20, name.length * 4.4 + 6);
          const tHeight = 7.5;
          const rawTX = star.x - tWidth / 2;
          const tX = Math.max(1, Math.min(rawTX, 99 - tWidth));
          const tY = star.y > 75 ? star.y - r - tHeight - 2 : star.y + r + 2;
          return { tX, tY, tWidth, tHeight, name };
        })()
      : null;

  return (
    <svg
      className="gsp-constellation-diagram"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="100" height="100" rx="4" fill="rgba(0,0,0,0.5)" />
      {outline.lines.map((line, i) => {
        const sa = outline.stars[line[0]];
        const sb = outline.stars[line[1]];
        return (
          <line
            key={i}
            x1={sa.x}
            y1={sa.y}
            x2={sb.x}
            y2={sb.y}
            stroke="rgba(200,215,255,0.25)"
            strokeWidth="0.7"
          />
        );
      })}
      {outline.stars.map((star, i) => {
        const isSystem = !!star.systemId;
        const color = isSystem
          ? (SYSTEM_COLORS[star.systemId!] ?? "#ffffff")
          : "#c8d8ff";
        const r = starRadius(star.mag);
        return (
          <g
            key={i}
            style={{ cursor: isSystem ? "pointer" : "default" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => isSystem && onSelectSystem?.(star.systemId!)}
            onDoubleClick={() => isSystem && onZoomToSystem?.(star.systemId!)}
          >
            {isSystem && (
              <circle
                cx={star.x}
                cy={star.y}
                r={r + 3}
                fill="none"
                stroke={color}
                strokeWidth="0.6"
                opacity="0.4"
              />
            )}
            <circle
              cx={star.x}
              cy={star.y}
              r={r}
              fill={color}
              opacity={isSystem ? 1 : 0.75}
            />
          </g>
        );
      })}
      {tooltip && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={tooltip.tX}
            y={tooltip.tY}
            width={tooltip.tWidth}
            height={tooltip.tHeight}
            rx="1.5"
            fill="rgba(8,12,24,0.9)"
          />
          <text
            x={tooltip.tX + tooltip.tWidth / 2}
            y={tooltip.tY + 5.4}
            textAnchor="middle"
            fontSize="4.5"
            fill="rgba(200,220,255,0.95)"
            fontFamily="Syne,sans-serif"
          >
            {tooltip.name}
          </text>
        </g>
      )}
    </svg>
  );
}

interface GalaxySystemPanelProps {
  systemId: string | null;
  regionId: string | null;
  constellationId: string | null;
  onExplore: (id: string) => void;
  onSelectRegion?: (id: string) => void;
  onSelectSystem?: (id: string) => void;
  onZoomToSystem?: (id: string) => void;
}

const ROOT_TYPE_LABELS: Record<string, string> = {
  star: "Star System",
  "black-hole": "Black Hole",
  "neutron-star": "Neutron Star",
  quasar: "Quasar",
};

const ROOT_TYPE_ICONS: Record<string, string> = {
  star: "☀",
  "black-hole": "◉",
  "neutron-star": "✶",
  quasar: "✵",
};

export default function GalaxySystemPanel({
  systemId,
  regionId,
  constellationId,
  onExplore,
  onSelectRegion,
  onSelectSystem,
  onZoomToSystem,
}: GalaxySystemPanelProps): JSX.Element {
  const rootTypeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of GALAXY_DATA.systems) {
      map[entry.id] = entry.rootType;
    }
    for (const s of STAR_SYSTEMS) {
      if (!map[s.id]) map[s.id] = s.rootType ?? "star";
    }
    return map;
  }, []);

  if (constellationId && !systemId && !regionId) {
    const constellation = CONSTELLATIONS.find((c) => c.id === constellationId);
    if (constellation) {
      const memberSystems = constellation.systems
        .map((id) => STAR_SYSTEMS.find((s) => s.id === id))
        .filter(Boolean);
      return (
        <div className="galaxy-system-panel">
          <div className="gsp-header">
            <span className="gsp-type-badge gsp-type-badge--constellation">
              <span className="gsp-type-icon">✦</span>
              Constellation
            </span>
          </div>
          <div className="gsp-name">{constellation.name}</div>
          {constellation.outline && (
            <ConstellationDiagram
              outline={constellation.outline}
              onSelectSystem={onSelectSystem}
              onZoomToSystem={onZoomToSystem}
            />
          )}
          <p className="gsp-description">{constellation.description}</p>
          <div className="gsp-section">
            <div className="gsp-section-title">Fun Fact</div>
            <p className="gsp-fun-fact">{constellation.funFact}</p>
          </div>
          <div className="gsp-section">
            <div className="gsp-section-title">Member Systems</div>
            <div className="gsp-member-systems">
              {memberSystems.map((s) => (
                <button
                  key={s!.id}
                  className="gsp-member-system-btn"
                  onClick={() => onSelectSystem?.(s!.id)}
                  onDoubleClick={() => onZoomToSystem?.(s!.id)}
                >
                  <span
                    className="gsp-member-dot"
                    style={{ background: s!.starColor }}
                  />
                  {s!.name}
                </button>
              ))}
            </div>
          </div>
          {constellation.wikipediaUrl && (
            <div className="gsp-section">
              <div className="gsp-section-title">Learn More</div>
              <div className="links-list">
                <ExternalLink
                  href={constellation.wikipediaUrl}
                  badge={<span className="ext-badge wiki-badge">W</span>}
                  label="Wikipedia"
                />
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  if (regionId) {
    const region = GALAXY_REGIONS.find((r) => r.id === regionId);
    if (region) {
      return (
        <div className="galaxy-system-panel">
          <div className="gsp-header">
            <span className="gsp-type-badge gsp-type-badge--region">
              <span className="gsp-type-icon">✦</span>
              Galactic Region
            </span>
          </div>
          <div className="gsp-name">{region.name}</div>
          <p className="gsp-description">{region.description}</p>
          <div className="gsp-section">
            <div className="gsp-section-title">Fun Fact</div>
            <p className="gsp-fun-fact">{region.funFact}</p>
          </div>
          {region.wikipediaUrl && (
            <div className="gsp-section">
              <div className="gsp-section-title">Learn More</div>
              <div className="links-list">
                <ExternalLink
                  href={region.wikipediaUrl}
                  badge={<span className="ext-badge wiki-badge">W</span>}
                  label="Wikipedia"
                />
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  if (!systemId) {
    return (
      <div className="galaxy-system-panel galaxy-system-panel--empty">
        <span className="galaxy-system-panel__placeholder">
          Select a system or region to see details
        </span>
      </div>
    );
  }

  const meta = STAR_SYSTEMS.find((s) => s.id === systemId);
  if (!meta) {
    return (
      <div className="galaxy-system-panel galaxy-system-panel--empty">
        <span className="galaxy-system-panel__placeholder">
          System not found
        </span>
      </div>
    );
  }

  const rootType = rootTypeById[systemId] ?? "star";
  const rootTypeLabel = ROOT_TYPE_LABELS[rootType] ?? "Star System";
  const rootTypeIcon = ROOT_TYPE_ICONS[rootType] ?? "☀";
  const isExtragalactic = !GALACTIC_IDS.has(systemId);

  const galacticEntry = !isExtragalactic
    ? GALAXY_DATA.systems.find((s) => s.id === systemId)
    : null;
  const mapDist = galacticEntry
    ? Math.round(
        Math.sqrt(galacticEntry.galacticX ** 2 + galacticEntry.galacticY ** 2),
      )
    : null;
  const dist3D = meta.distanceFromEarth;
  const showProjection =
    mapDist !== null &&
    dist3D !== undefined &&
    dist3D > 0 &&
    Math.abs(mapDist - dist3D) / dist3D > 0.1;
  const heightAbovePlane = showProjection
    ? Math.round(Math.sqrt(dist3D! ** 2 - mapDist! ** 2))
    : null;

  return (
    <div className="galaxy-system-panel">
      <div className="gsp-header">
        <span className={`gsp-type-badge gsp-type-badge--${rootType}`}>
          <span className="gsp-type-icon">{rootTypeIcon}</span>
          {rootTypeLabel}
        </span>
      </div>
      <div className="gsp-name">{meta.name}</div>
      {dist3D !== undefined && dist3D > 0 && (
        <div className="gsp-distance-block">
          <div className="gsp-distance">
            <span className="gsp-distance-label">Distance from Earth</span>
            <span className="gsp-distance-value">{formatLY(dist3D)}</span>
          </div>
          {showProjection && (
            <>
              <div className="gsp-distance">
                <span className="gsp-distance-label">On galaxy map</span>
                <span className="gsp-distance-value">{formatLY(mapDist!)}</span>
              </div>
              <p className="gsp-projection-note">
                {formatLY(heightAbovePlane!)} above the galactic plane — the map
                is a top-down view, so this system appears closer to Sol than
                its true distance.
              </p>
            </>
          )}
        </div>
      )}
      {meta.description && (
        <p className="gsp-description">{meta.description}</p>
      )}
      {galacticEntry?.galacticArmHint &&
        renderArmHint(
          galacticEntry.galacticArmHint as GalacticArmHint,
          onSelectRegion,
        )}
      {isExtragalactic && (
        <p className="gsp-note">
          Beyond the Milky Way — not visible on the galaxy map.
        </p>
      )}
      <div className="gsp-section">
        <div className="gsp-section-title">Learn More</div>
        {!meta.nasaUrl && !meta.wikipediaUrl ? (
          <div className="links-unavailable">
            No publicly available information
          </div>
        ) : (
          <div className="links-list">
            <ExternalLink
              href={meta.nasaUrl}
              badge={<span className="ext-badge nasa-badge">NASA</span>}
              label="NASA"
            />
            <ExternalLink
              href={meta.wikipediaUrl}
              badge={<span className="ext-badge wiki-badge">W</span>}
              label="Wikipedia"
            />
          </div>
        )}
      </div>

      {meta.navigable !== false && (
        <button className="gsp-explore-btn" onClick={() => onExplore(systemId)}>
          Explore System →
        </button>
      )}
    </div>
  );
}
