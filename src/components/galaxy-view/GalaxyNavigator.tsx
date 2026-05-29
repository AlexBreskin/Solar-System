import { useState } from "react";
import type { Constellation, StarSystemMeta } from "@/types";
import {
  ROOT_TYPE_BY_ID,
  ROOT_TYPE_ICONS,
  ROOT_TYPE_LABELS,
} from "@/data/systemMeta";
import { useNavFilter } from "@/hooks/useNavFilter";
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

  const { filteredGalactic, filteredExtragalactic, filteredConstellations } =
    useNavFilter(query);

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
            ? filteredGalactic.length + filteredExtragalactic.length
            : filteredConstellations.length}
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
                rootType={ROOT_TYPE_BY_ID[s.id] ?? "star"}
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
                rootType={ROOT_TYPE_BY_ID[s.id] ?? "star"}
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
