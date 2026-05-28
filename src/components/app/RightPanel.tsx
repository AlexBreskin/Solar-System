import GalaxySystemPanel from "@/components/galaxy-view/GalaxySystemPanel";
import InfoPanel from "@/components/system-view/InfoPanel";
import type { BodyId } from "@/types";

interface RightPanelProps {
  isGalaxy: boolean;
  showSystemPanel: boolean;
  selectedSystem: string | null;
  selectedRegion: string | null;
  selectedConstellation: string | null;
  systemDataId: string;
  selectedBody: BodyId;
  onExplore: (id: string) => void;
  onSelectRegion: (id: string | null) => void;
  onSelectSystem: (id: string) => void;
  onZoomToSystem: (id: string) => void;
}

export default function RightPanel({
  isGalaxy,
  showSystemPanel,
  selectedSystem,
  selectedRegion,
  selectedConstellation,
  systemDataId,
  selectedBody,
  onExplore,
  onSelectRegion,
  onSelectSystem,
  onZoomToSystem,
}: RightPanelProps): JSX.Element {
  if (isGalaxy || showSystemPanel) {
    return (
      <GalaxySystemPanel
        systemId={isGalaxy ? selectedSystem : systemDataId}
        regionId={isGalaxy ? selectedRegion : null}
        constellationId={isGalaxy ? selectedConstellation : null}
        onExplore={onExplore}
        onSelectRegion={isGalaxy ? onSelectRegion : undefined}
        onSelectSystem={isGalaxy ? onSelectSystem : undefined}
        onZoomToSystem={isGalaxy ? onZoomToSystem : undefined}
      />
    );
  }
  return <InfoPanel selectedBody={selectedBody} />;
}
