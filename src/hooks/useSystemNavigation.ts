import { useCallback } from "react";
import { loadStarSystem } from "@/data/celestialBodies";
import { ROOT_BODY_TYPES } from "@/types";
import type { BodyId, TabId } from "@/types";
import type { StarSystemData } from "@/shared/contexts/StarSystemContext";

export interface SystemNavigationState {
  handleSystemChange: (id: string) => void;
  handleExploreSystem: (id: string) => void;
}

export function useSystemNavigation(
  currentSystemId: string,
  setSystemData: (data: StarSystemData) => void,
  onGalaxySelect: (id: string) => void,
  onTabChange: (tab: TabId) => void,
  onBodyReset: (starId: BodyId) => void,
): SystemNavigationState {
  const handleSystemChange = useCallback(
    (id: string) => {
      if (id === currentSystemId) return;
      try {
        const loaded = loadStarSystem(id);
        const starId =
          (Object.values(loaded.bodies).find((b) => ROOT_BODY_TYPES.has(b.type))
            ?.id as BodyId) ?? (id as BodyId);
        setSystemData(loaded);
        onGalaxySelect(id);
        onBodyReset(starId);
        onTabChange("solar-system");
      } catch {
        // Unknown system — ignore
      }
    },
    [currentSystemId, setSystemData, onGalaxySelect, onBodyReset, onTabChange],
  );

  const handleExploreSystem = useCallback(
    (id: string) => {
      onGalaxySelect(id);
      if (id === currentSystemId) {
        onTabChange("solar-system");
      } else {
        handleSystemChange(id);
      }
    },
    [currentSystemId, handleSystemChange, onGalaxySelect, onTabChange],
  );

  return { handleSystemChange, handleExploreSystem };
}
