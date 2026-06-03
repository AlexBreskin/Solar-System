import { JSX } from "react";
import { STAR_SYSTEMS } from "@/data/systems";
import { GALAXY_DATA, GALACTIC_IDS, GALAXY_REGIONS } from "@/data/galaxy";
import { CONSTELLATIONS } from "@/data/constellations";
import type {
  GalacticArmHint,
  GalacticSystemEntry,
  Constellation,
  GalaxyRegion,
} from "@/types/galaxy";
import type { StarSystemMeta } from "@/types";
import { formatLY } from "@/utils/distance";
import { ConstellationDiagram } from "./constellation/ConstellationDiagram";
import {
  ROOT_TYPE_BY_ID,
  ROOT_TYPE_ICONS,
  ROOT_TYPE_LABELS,
} from "@/data/systemMeta";
import { ExternalLink, PanelLinks } from "@/shared/components/ExternalLink";
import "./GalaxySystemPanel.css";

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

function ConstellationPanel({
  constellation,
  onSelectSystem,
  onZoomToSystem,
}: {
  constellation: Constellation;
  onSelectSystem?: (id: string) => void;
  onZoomToSystem?: (id: string) => void;
}): JSX.Element {
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
        <>
          <ConstellationDiagram
            key={constellation.id}
            outline={constellation.outline}
            onSelectSystem={onSelectSystem}
            onZoomToSystem={onZoomToSystem}
          />
          <p className="gsp-diagram-credit">
            Outline:{" "}
            <a
              href="https://github.com/ofrohn/d3-celestial"
              target="_blank"
              rel="noopener noreferrer"
            >
              d3-celestial
            </a>{" "}
            · BSD-3-Clause
          </p>
        </>
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

function RegionPanel({ region }: { region: GalaxyRegion }): JSX.Element {
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

function rootTypeInfo(systemId: string): {
  rootType: string;
  label: string;
  icon: string;
} {
  const rootType = ROOT_TYPE_BY_ID[systemId] ?? "star";
  return {
    rootType,
    label: ROOT_TYPE_LABELS[rootType] ?? "Star System",
    icon: ROOT_TYPE_ICONS[rootType] ?? "☀",
  };
}

function DistanceBlock({
  dist3D,
  galacticEntry,
}: {
  dist3D: number;
  galacticEntry: GalacticSystemEntry | null | undefined;
}): JSX.Element | null {
  if (dist3D <= 0) return null;
  const mapDist = galacticEntry
    ? Math.round(
        Math.sqrt(galacticEntry.galacticX ** 2 + galacticEntry.galacticY ** 2),
      )
    : null;
  const showProjection =
    mapDist !== null && Math.abs(mapDist - dist3D) / dist3D > 0.1;
  const heightAbovePlane = showProjection
    ? Math.round(Math.sqrt(dist3D ** 2 - mapDist! ** 2))
    : null;
  return (
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
            {formatLY(heightAbovePlane!)} above the galactic plane — the map is
            a top-down view, so this system appears closer to Sol than its true
            distance.
          </p>
        </>
      )}
    </div>
  );
}

function SystemPanel({
  systemId,
  meta,
  onExplore,
  onSelectRegion,
}: {
  systemId: string;
  meta: StarSystemMeta;
  onExplore: (id: string) => void;
  onSelectRegion?: (id: string) => void;
}): JSX.Element {
  const {
    rootType,
    label: rootTypeLabel,
    icon: rootTypeIcon,
  } = rootTypeInfo(systemId);
  const isExtragalactic = !GALACTIC_IDS.has(systemId);
  const galacticEntry = !isExtragalactic
    ? GALAXY_DATA.systems.find((s) => s.id === systemId)
    : null;
  const dist3D = meta.distanceFromEarth;

  return (
    <div className="galaxy-system-panel">
      <div className="gsp-header">
        <span className={`gsp-type-badge gsp-type-badge--${rootType}`}>
          <span className="gsp-type-icon">{rootTypeIcon}</span>
          {rootTypeLabel}
        </span>
      </div>
      <div className="gsp-name">{meta.name}</div>
      {dist3D !== undefined && (
        <DistanceBlock dist3D={dist3D} galacticEntry={galacticEntry} />
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
        <PanelLinks nasaUrl={meta.nasaUrl} wikipediaUrl={meta.wikipediaUrl} />
      </div>
      {meta.navigable !== false && (
        <button className="gsp-explore-btn" onClick={() => onExplore(systemId)}>
          Explore System →
        </button>
      )}
    </div>
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

export default function GalaxySystemPanel({
  systemId,
  regionId,
  constellationId,
  onExplore,
  onSelectRegion,
  onSelectSystem,
  onZoomToSystem,
}: GalaxySystemPanelProps): JSX.Element {
  if (constellationId && !systemId && !regionId) {
    const constellation = CONSTELLATIONS.find((c) => c.id === constellationId);
    if (constellation)
      return (
        <ConstellationPanel
          constellation={constellation}
          onSelectSystem={onSelectSystem}
          onZoomToSystem={onZoomToSystem}
        />
      );
  }

  if (regionId) {
    const region = GALAXY_REGIONS.find((r) => r.id === regionId);
    if (region) return <RegionPanel region={region} />;
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

  return (
    <SystemPanel
      systemId={systemId}
      meta={meta}
      onExplore={onExplore}
      onSelectRegion={onSelectRegion}
    />
  );
}
