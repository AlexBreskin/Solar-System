import type { TabId } from "@/types";
import { JSX } from "react";

interface HeaderControlsProps {
  isGalaxy: boolean;
  activeTab: TabId;
  paused: boolean;
  speed: number;
  showOrbits: boolean;
  showLabels: boolean;
  onTogglePause: () => void;
  onSpeedChange: (value: number) => void;
  onToggleOrbits: () => void;
  onToggleLabels: () => void;
}

export default function HeaderControls({
  isGalaxy,
  activeTab,
  paused,
  speed,
  showOrbits,
  showLabels,
  onTogglePause,
  onSpeedChange,
  onToggleOrbits,
  onToggleLabels,
}: HeaderControlsProps): JSX.Element {
  return (
    <div className="header-controls">
      {!isGalaxy && (
        <>
          <button
            className={`ctrl-btn${paused ? " active" : ""}`}
            onClick={onTogglePause}
            title={paused ? "Resume" : "Pause"}
          >
            {paused ? "▶" : "⏸"}
          </button>
          <div className="speed-control">
            <span className="ctrl-label">Speed</span>
            <input
              type="range"
              min="0.1"
              max="10"
              step="0.1"
              value={speed}
              onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span className="speed-value">{speed.toFixed(1)}×</span>
          </div>
        </>
      )}
      {activeTab === "solar-system" && (
        <>
          <button
            className={`ctrl-btn${showOrbits ? " active" : ""}`}
            onClick={onToggleOrbits}
          >
            ⊙ Orbits
          </button>
          <button
            className={`ctrl-btn${showLabels ? " active" : ""}`}
            onClick={onToggleLabels}
          >
            ◫ Labels
          </button>
        </>
      )}
      {activeTab === "planet-view" && (
        <button
          className={`ctrl-btn${showLabels ? " active" : ""}`}
          onClick={onToggleLabels}
        >
          ◫ Labels
        </button>
      )}
    </div>
  );
}
