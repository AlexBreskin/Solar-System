import { useEffect } from "react";
import type { RefObject } from "react";
import type { GalaxySimulation } from "@/simulation/galaxySimulation";
import { GALAXY_REGIONS } from "@/data/galaxy";
import type { GalaxyRegion } from "@/types/galaxy";

interface UseGalaxySyncRefsProps {
  sim: GalaxySimulation;
  hoveredSystem: string | null;
  selectedSystem: string | null;
  selectedSystemRef: RefObject<string | null>;
  selectedRegion: string | null;
  selectedRegionRef: RefObject<string | null>;
  selectedRegionObjRef: RefObject<GalaxyRegion | null>;
  constellationSystemIds: Set<string> | undefined;
  constellationSystemIdsRef: RefObject<Set<string> | undefined>;
}

export function useGalaxySyncRefs({
  sim,
  hoveredSystem,
  selectedSystem,
  selectedSystemRef,
  selectedRegion,
  selectedRegionRef,
  selectedRegionObjRef,
  constellationSystemIds,
  constellationSystemIdsRef,
}: UseGalaxySyncRefsProps): void {
  useEffect(() => {
    sim.setHovered(hoveredSystem ?? null);
  }, [sim, hoveredSystem]);

  useEffect(() => {
    selectedSystemRef.current = selectedSystem;
  }, [selectedSystem]);

  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
    selectedRegionObjRef.current =
      GALAXY_REGIONS.find((r) => r.id === selectedRegion) ?? null;
  }, [selectedRegion]);

  useEffect(() => {
    constellationSystemIdsRef.current = constellationSystemIds;
  }, [constellationSystemIds]);
}
