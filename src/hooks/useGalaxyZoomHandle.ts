import { useImperativeHandle } from "react";
import type { Ref } from "react";
import type { GalaxySimulation } from "@/simulation/galaxySimulation";
import { GALAXY_SCALE } from "@/hooks/useGalaxyPointerHandlers";
import type { PanState } from "@/hooks/useGalaxyPointerHandlers";

export interface GalaxyCanvasHandle {
  zoomToSystem: (id: string) => void;
}

export function useGalaxyZoomHandle(
  ref: Ref<GalaxyCanvasHandle | null> | undefined,
  sim: GalaxySimulation,
  panRef: { current: PanState },
): void {
  useImperativeHandle(
    ref,
    () => ({
      zoomToSystem(id: string) {
        const marker = sim.markers.find((m) => m.id === id);
        if (!marker) return;
        const targetZoom = Math.max(panRef.current.targetZoom, 5);
        const scale = GALAXY_SCALE * targetZoom;
        panRef.current.targetPanX = -marker.worldX * scale;
        panRef.current.targetPanY = -marker.worldY * scale;
        panRef.current.targetZoom = targetZoom;
      },
    }),
    [sim],
  );
}
