import { useState, useCallback, useMemo, useRef } from "react";
import type { GalaxyCanvasHandle } from "@/components/galaxy-view/GalaxyCanvas";
import { CONSTELLATIONS } from "@/data/constellations";

export interface GalaxyState {
  selectedSystem: string | null;
  hoveredSystem: string | null;
  selectedRegion: string | null;
  selectedConstellation: string | null;
  constellationSystemIds: Set<string>;
  canvasRef: React.RefObject<GalaxyCanvasHandle>;
  selectSystem: (id: string) => void;
  hoverSystem: (id: string | null) => void;
  selectRegion: (id: string | null) => void;
  selectConstellation: (id: string | null) => void;
  zoomToSystem: (id: string) => void;
}

export function useGalaxyState(initialSystemId: string): GalaxyState {
  const [selectedSystem, setSelectedSystem] = useState<string | null>(
    initialSystemId,
  );
  const [hoveredSystem, setHoveredSystem] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedConstellation, setSelectedConstellation] = useState<
    string | null
  >(null);
  const canvasRef = useRef<GalaxyCanvasHandle>(null);

  const constellationSystemIds = useMemo(() => {
    if (!selectedConstellation) return new Set<string>();
    const c = CONSTELLATIONS.find((c) => c.id === selectedConstellation);
    return new Set(c?.systems ?? []);
  }, [selectedConstellation]);

  const selectSystem = useCallback((id: string) => {
    setSelectedSystem(id);
    setSelectedRegion(null);
    setSelectedConstellation(null);
  }, []);

  const hoverSystem = useCallback((id: string | null) => {
    setHoveredSystem(id);
  }, []);

  const selectRegion = useCallback((id: string | null) => {
    setSelectedRegion(id);
    setSelectedSystem(null);
  }, []);

  const selectConstellation = useCallback((id: string | null) => {
    setSelectedConstellation(id);
    setSelectedSystem(null);
    setSelectedRegion(null);
  }, []);

  const zoomToSystem = useCallback((id: string) => {
    setSelectedSystem(id);
    setSelectedRegion(null);
    setSelectedConstellation(null);
    canvasRef.current?.zoomToSystem(id);
  }, []);

  return {
    selectedSystem,
    hoveredSystem,
    selectedRegion,
    selectedConstellation,
    constellationSystemIds,
    canvasRef,
    selectSystem,
    hoverSystem,
    selectRegion,
    selectConstellation,
    zoomToSystem,
  };
}
