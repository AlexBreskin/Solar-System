import { useMemo, useState } from "react";
import { STAR_SYSTEMS } from "../data/systems";
import { GALAXY_DATA, GALACTIC_IDS } from "../data/galaxy";
import { CONSTELLATIONS } from "../data/constellations";
import type { Constellation, StarSystemMeta } from "../types";
import "./GalaxyNavigator.css";

interface GalaxyNavigatorProps {
  selectedSystem: string | null;
  hoveredSystem: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onZoomToSystem?: (id: string) => void;
  selectedConstellation: string | null;
  onSelectConstellation: (id: string | null) => void;
}

const ROOT_TYPE_ICONS: Record<string, string> = {
  star: "☀",
  "black-hole": "◉",
  "neutron-star": "✶",
  quasar: "✵",
};

const ROOT_TYPE_LABELS: Record<string, string> = {
  star: "Star System",
  "black-hole": "Black Hole",
  "neutron-star": "Neutron Star",
  quasar: "Quasar",
};

function SystemRow({
  s,
  rootType,
  isSelected,
  isHovered,
  onSelectSystem,
  onHoverSystem,
  onZoomToSystem,
}: {
  s: StarSystemMeta;
  rootType: string;
  isSelected: boolean;
  isHovered: boolean;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onZoomToSystem?: (id: string) => void;
}): JSX.Element {
  return (
    <div
      className={`gnav-row${isSelected ? " selected" : ""}${isHovered ? " hovered" : ""}`}
      onClick={() => onSelectSystem(s.id)}
      onDoubleClick={() => onZoomToSystem?.(s.id)}
      onMouseEnter={() => onHoverSystem(s.id)}
      onMouseLeave={() => onHoverSystem(null)}
    >
      <span className="gnav-dot" style={{ background: s.starColor }} />
      <span
        className="gnav-icon"
        title={ROOT_TYPE_LABELS[rootType] ?? "Star System"}
      >
        {ROOT_TYPE_ICONS[rootType] ?? "☀"}
      </span>
      <span className="gnav-name">{s.name}</span>
      <span className="gnav-badge">
        {ROOT_TYPE_LABELS[rootType] ?? "Star System"}
      </span>
    </div>
  );
}

function ConstellationRow({
  c,
  isSelected,
  onSelect,
}: {
  c: Constellation;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
}): JSX.Element {
  return (
    <div
      className={`gnav-row gnav-row--constellation${isSelected ? " selected" : ""}`}
      onClick={() => onSelect(isSelected ? null : c.id)}
    >
      <span className="gnav-icon gnav-icon--constellation">✦</span>
      <span className="gnav-name">{c.name}</span>
      <span className="gnav-badge">{c.systems.length} systems</span>
    </div>
  );
}

export default function GalaxyNavigator({
  selectedSystem,
  hoveredSystem,
  onSelectSystem,
  onHoverSystem,
  onZoomToSystem,
  selectedConstellation,
  onSelectConstellation,
}: GalaxyNavigatorProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<"systems" | "constellations">(
    "systems",
  );
  const [query, setQuery] = useState("");

  const rootTypeById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of GALAXY_DATA.systems) map[entry.id] = entry.rootType;
    for (const s of STAR_SYSTEMS) {
      if (!map[s.id]) map[s.id] = s.rootType ?? "star";
    }
    return map;
  }, []);

  const systemNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of STAR_SYSTEMS) map[s.id] = s.name.toLowerCase();
    return map;
  }, []);

  const { galactic, extragalactic } = useMemo(() => {
    const byDist = (a: StarSystemMeta, b: StarSystemMeta) =>
      (a.distanceFromEarth ?? 0) - (b.distanceFromEarth ?? 0);
    return {
      galactic: STAR_SYSTEMS.filter((s) => GALACTIC_IDS.has(s.id)).sort(byDist),
      extragalactic: STAR_SYSTEMS.filter((s) => !GALACTIC_IDS.has(s.id)).sort(
        byDist,
      ),
    };
  }, []);

  const q = query.toLowerCase();

  const filteredGalactic = q
    ? galactic.filter((s) => s.name.toLowerCase().includes(q))
    : galactic;
  const filteredExtragalactic = q
    ? extragalactic.filter((s) => s.name.toLowerCase().includes(q))
    : extragalactic;
  const filteredConstellations = q
    ? CONSTELLATIONS.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.systems.some((id) => systemNameById[id]?.includes(q)),
      )
    : CONSTELLATIONS;

  const handleTabChange = (tab: "systems" | "constellations") => {
    setActiveTab(tab);
    setQuery("");
  };

  return (
    <div className="gnav">
      <div className="gnav-header">
        <span className="gnav-title">
          {activeTab === "systems" ? "Star Systems" : "Constellations"}
        </span>
        <span className="gnav-count">
          {activeTab === "systems"
            ? STAR_SYSTEMS.length
            : CONSTELLATIONS.length}
        </span>
      </div>
      <div className="gnav-tabs">
        <button
          className={`gnav-tab${activeTab === "systems" ? " active" : ""}`}
          onClick={() => handleTabChange("systems")}
        >
          Systems
        </button>
        <button
          className={`gnav-tab${activeTab === "constellations" ? " active" : ""}`}
          onClick={() => handleTabChange("constellations")}
        >
          Constellations
        </button>
      </div>
      <div className="gnav-scroll">
        <div className="gnav-search-wrap">
          <input
            className="gnav-search"
            type="search"
            placeholder={
              activeTab === "systems"
                ? "Filter systems…"
                : "Filter constellations…"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {activeTab === "systems" && (
          <>
            <div className="gnav-section">Milky Way</div>
            {filteredGalactic.map((s) => (
              <SystemRow
                key={s.id}
                s={s}
                rootType={rootTypeById[s.id] ?? "star"}
                isSelected={selectedSystem === s.id}
                isHovered={hoveredSystem === s.id}
                onSelectSystem={onSelectSystem}
                onHoverSystem={onHoverSystem}
                onZoomToSystem={onZoomToSystem}
              />
            ))}
            <div className="gnav-section gnav-section--extra">
              Beyond the Milky Way
            </div>
            {filteredExtragalactic.map((s) => (
              <SystemRow
                key={s.id}
                s={s}
                rootType={rootTypeById[s.id] ?? "star"}
                isSelected={selectedSystem === s.id}
                isHovered={hoveredSystem === s.id}
                onSelectSystem={onSelectSystem}
                onHoverSystem={onHoverSystem}
                onZoomToSystem={onZoomToSystem}
              />
            ))}
          </>
        )}
        {activeTab === "constellations" &&
          filteredConstellations.map((c) => (
            <ConstellationRow
              key={c.id}
              c={c}
              isSelected={selectedConstellation === c.id}
              onSelect={onSelectConstellation}
            />
          ))}
      </div>
    </div>
  );
}
