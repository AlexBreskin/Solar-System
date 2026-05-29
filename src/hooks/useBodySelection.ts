import { useState, useCallback } from "react";
import { BodyType } from "@/types";
import type { BodyId, TabId } from "@/types";
import type { StarSystemData } from "@/shared/contexts/StarSystemContext";

export interface BodySelectionState {
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  trackedBody: BodyId | null;
  viewedPlanet: BodyId;
  showSystemPanel: boolean;
  setTrackedBody: (id: BodyId | null) => void;
  setViewedPlanet: (id: BodyId) => void;
  setShowSystemPanel: (v: boolean) => void;
  resetForNewSystem: (starId: BodyId) => void;
  handleSelectBody: (id: BodyId) => void;
  handleHoverBody: (id: BodyId | null) => void;
  handleTrackBody: (id: BodyId | null) => void;
  handleViewPlanet: (id: BodyId) => void;
}

export function useBodySelection(
  activeTab: TabId,
  bodies: StarSystemData["bodies"],
): BodySelectionState {
  const [selectedBody, setSelectedBody] = useState<BodyId>("sun");
  const [hoveredBody, setHoveredBody] = useState<BodyId | null>(null);
  const [trackedBody, setTrackedBody] = useState<BodyId | null>(null);
  const [viewedPlanet, setViewedPlanet] = useState<BodyId>("earth");
  const [showSystemPanel, setShowSystemPanel] = useState(false);

  const handleSelectBody = useCallback(
    (id: BodyId) => {
      setSelectedBody(id);
      setShowSystemPanel(false);
      if (activeTab === "solar-system") {
        if (bodies[id]?.type === BodyType.Belt) setTrackedBody(null);
        else setTrackedBody(id);
      }
    },
    [activeTab, bodies],
  );

  const handleTrackBody = useCallback((id: BodyId | null) => {
    setTrackedBody((prev) => (prev === id ? null : id));
    if (id) setSelectedBody(id);
  }, []);

  const resetForNewSystem = useCallback((starId: BodyId) => {
    setSelectedBody(starId);
    setHoveredBody(null);
    setTrackedBody(null);
    setViewedPlanet(starId);
    setShowSystemPanel(false);
  }, []);

  return {
    selectedBody,
    hoveredBody,
    trackedBody,
    viewedPlanet,
    showSystemPanel,
    setTrackedBody,
    setViewedPlanet,
    setShowSystemPanel,
    resetForNewSystem,
    handleSelectBody,
    handleHoverBody: setHoveredBody as (id: BodyId | null) => void,
    handleTrackBody,
    handleViewPlanet: setViewedPlanet as (id: BodyId) => void,
  };
}
