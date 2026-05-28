import type { RefObject } from "react";
import SystemCanvas from "@/components/system-view/SystemCanvas";
import GalaxyCanvas, {
  type GalaxyCanvasHandle,
} from "@/components/galaxy-view/GalaxyCanvas";
import PlanetCanvas from "@/components/planet-view/PlanetCanvas";
import type { BodyId, TabId } from "@/types";

interface CanvasAreaProps {
  activeTab: TabId;
  systemDataId: string;
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  trackedBody: BodyId | null;
  speed: number;
  paused: boolean;
  showOrbits: boolean;
  showLabels: boolean;
  viewedPlanet: BodyId;
  galaxyCanvasRef: RefObject<GalaxyCanvasHandle>;
  galaxySelectedSystem: string | null;
  galaxyHoveredSystem: string | null;
  galaxySelectedRegion: string | null;
  constellationSystemIds: Set<string>;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
  onTrackBody: (id: BodyId | null) => void;
  onGalaxySelectSystem: (id: string) => void;
  onGalaxyHoverSystem: (id: string | null) => void;
  onGalaxySelectRegion: (id: string | null) => void;
}

export default function CanvasArea({
  activeTab,
  systemDataId,
  selectedBody,
  hoveredBody,
  trackedBody,
  speed,
  paused,
  showOrbits,
  showLabels,
  viewedPlanet,
  galaxyCanvasRef,
  galaxySelectedSystem,
  galaxyHoveredSystem,
  galaxySelectedRegion,
  constellationSystemIds,
  onSelectBody,
  onHoverBody,
  onTrackBody,
  onGalaxySelectSystem,
  onGalaxyHoverSystem,
  onGalaxySelectRegion,
}: CanvasAreaProps): JSX.Element {
  if (activeTab === "solar-system") {
    return (
      <SystemCanvas
        key={systemDataId}
        selectedBody={selectedBody}
        hoveredBody={hoveredBody}
        trackedBody={trackedBody}
        speed={speed}
        paused={paused}
        showOrbits={showOrbits}
        showLabels={showLabels}
        onSelectBody={onSelectBody}
        onHoverBody={onHoverBody}
        onTrackBody={onTrackBody}
      />
    );
  }
  if (activeTab === "galaxy") {
    return (
      <GalaxyCanvas
        ref={galaxyCanvasRef}
        selectedSystem={galaxySelectedSystem}
        hoveredSystem={galaxyHoveredSystem}
        selectedRegion={galaxySelectedRegion}
        onSelectSystem={onGalaxySelectSystem}
        onHoverSystem={onGalaxyHoverSystem}
        onSelectRegion={onGalaxySelectRegion}
        constellationSystemIds={constellationSystemIds}
      />
    );
  }
  return (
    <PlanetCanvas
      key={`${systemDataId}-${viewedPlanet}`}
      planetId={viewedPlanet}
      selectedBody={selectedBody}
      hoveredBody={hoveredBody}
      speed={speed}
      paused={paused}
      showLabels={showLabels}
      onSelectBody={onSelectBody}
      onHoverBody={onHoverBody}
    />
  );
}
