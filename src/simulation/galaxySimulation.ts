import type { GalaxyData, GalaxyRegion, StarSystemMeta } from "../types";
import { pointInRegionShape } from "../utils/spiralGeometry";

export interface GalaxyMarker {
  id: string;
  name: string;
  starColor: string;
  rootType: string;
  worldX: number;
  worldY: number;
  distanceFromEarth?: number;
}

export class GalaxySimulation {
  readonly markers: GalaxyMarker[];
  readonly regions: GalaxyRegion[];
  hoveredId: string | null;
  selectedId: string | null;

  constructor(galaxyData: GalaxyData, starSystems: StarSystemMeta[]) {
    const metaById: Record<string, StarSystemMeta> = {};
    for (const s of starSystems) {
      metaById[s.id] = s;
    }
    this.markers = [];
    for (const entry of galaxyData.systems) {
      const meta = metaById[entry.id];
      if (!meta) continue;
      this.markers.push({
        id: entry.id,
        name: meta.name,
        starColor: meta.starColor,
        rootType: entry.rootType,
        worldX: entry.galacticX,
        worldY: entry.galacticY,
        distanceFromEarth: meta.distanceFromEarth,
      });
    }
    this.regions = galaxyData.regions;
    this.hoveredId = null;
    this.selectedId = null;
  }

  hitTestRegion(
    worldX: number,
    worldY: number,
    lyThreshold: number,
  ): GalaxyRegion | null {
    // Single pass: accumulate best shape-match (nearest label among containing
    // shapes) and best label-proximity match simultaneously.
    let shapeBest: GalaxyRegion | null = null;
    let shapeBestLabelDist = Infinity;
    let labelBest: GalaxyRegion | null = null;
    let labelBestDist = Infinity;
    for (const region of this.regions) {
      const labelDist = Math.hypot(
        worldX - region.labelX,
        worldY - region.labelY,
      );
      if (labelDist < lyThreshold && labelDist < labelBestDist) {
        labelBest = region;
        labelBestDist = labelDist;
      }
      if (!region.shape) continue;
      if (!pointInRegionShape(worldX, worldY, region.shape)) continue;
      if (labelDist < shapeBestLabelDist) {
        shapeBest = region;
        shapeBestLabelDist = labelDist;
      }
    }
    return shapeBest ?? labelBest;
  }

  hitTest(worldX: number, worldY: number, lyThreshold: number): string | null {
    let best: string | null = null;
    let bestDist = Infinity;
    for (const m of this.markers) {
      const d = Math.hypot(worldX - m.worldX, worldY - m.worldY);
      if (d < lyThreshold && d < bestDist) {
        best = m.id;
        bestDist = d;
      }
    }
    return best;
  }

  getSystemsNear(
    worldX: number,
    worldY: number,
    lyThreshold: number,
  ): GalaxyMarker[] {
    const result: GalaxyMarker[] = [];
    for (const m of this.markers) {
      const d = Math.hypot(worldX - m.worldX, worldY - m.worldY);
      if (d < lyThreshold) {
        result.push(m);
      }
    }
    return result;
  }

  setHovered(id: string | null): void {
    this.hoveredId = id;
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
  }
}
