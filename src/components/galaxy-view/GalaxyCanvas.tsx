import { useRef, useMemo, useCallback, useState, type Ref, JSX } from "react";
import { GalaxySimulation } from "@/simulation/galaxySimulation";
import ZoomControls from "@/shared/components/ZoomControls";
import { useZoomControls } from "@/shared/hooks/useZoomControls";
import { STAR_SYSTEMS } from "@/data/systems";
import { GALAXY_DATA, GALAXY_REGIONS } from "@/data/galaxy";
import {
  useGalaxyPointerHandlers,
  makePanState,
  makeDragState,
  type PanState,
  type DragState,
} from "@/hooks/useGalaxyPointerHandlers";
import {
  useGalaxyDrawLoop,
  makeLastBg,
  type LastBg,
} from "@/hooks/useGalaxyDrawLoop";
import { useGalaxyCanvasResize } from "@/hooks/useGalaxyCanvasResize";
import { useGalaxySyncRefs } from "@/hooks/useGalaxySyncRefs";
import {
  useGalaxyZoomHandle,
  type GalaxyCanvasHandle,
} from "@/hooks/useGalaxyZoomHandle";
import ClusterMenuPopup from "@/components/galaxy-view/ClusterMenuPopup";
import "./GalaxyCanvas.css";

interface GalaxyCanvasProps {
  ref?: Ref<GalaxyCanvasHandle | null>;
  selectedSystem: string | null;
  hoveredSystem: string | null;
  selectedRegion: string | null;
  onSelectSystem: (id: string) => void;
  onHoverSystem: (id: string | null) => void;
  onSelectRegion: (id: string | null) => void;
  constellationSystemIds?: Set<string>;
}

function createSim() {
  return new GalaxySimulation(GALAXY_DATA, STAR_SYSTEMS);
}

function findRegionById(id: string | null) {
  return GALAXY_REGIONS.find((r) => r.id === id) ?? null;
}

function regionsClass(active: boolean) {
  return `galaxy-regions-toggle${active ? " active" : ""}`;
}

export default function GalaxyCanvas({
  ref,
  selectedSystem,
  hoveredSystem,
  selectedRegion,
  onSelectSystem,
  onHoverSystem,
  onSelectRegion,
  constellationSystemIds,
}: GalaxyCanvasProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);
  const topCanvasRef = useRef<HTMLCanvasElement>(null);

  const sim = useMemo(createSim, []);

  const [showRegions, setShowRegions] = useState(false);
  const showRegionsRef = useRef(false);
  const hoveredRegionRef = useRef<string | null>(null);
  const selectedSystemRef = useRef(selectedSystem);
  const selectedRegionRef = useRef(selectedRegion);
  const selectedRegionObjRef = useRef(findRegionById(selectedRegion));
  const constellationSystemIdsRef = useRef(constellationSystemIds);

  const sizeRef = useRef({ w: 0, h: 0 });
  const animRef = useRef<number | null>(null);
  const lastBgRef = useRef<LastBg>(makeLastBg());
  const panRef = useRef<PanState>(makePanState());
  const dragRef = useRef<DragState>(makeDragState());
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());

  useGalaxySyncRefs({
    sim,
    hoveredSystem,
    selectedSystem,
    selectedSystemRef,
    selectedRegion,
    selectedRegionRef,
    selectedRegionObjRef,
    constellationSystemIds,
    constellationSystemIdsRef,
  });

  useGalaxyCanvasResize(
    containerRef,
    bgCanvasRef,
    topCanvasRef,
    sizeRef,
    lastBgRef,
  );

  useGalaxyDrawLoop(
    {
      bgCanvasRef,
      topCanvasRef,
      sizeRef,
      panRef,
      animRef,
      lastBgRef,
      showRegionsRef,
      selectedRegionObjRef,
      hoveredRegionRef,
      selectedRegionRef,
      selectedSystemRef,
      constellationSystemIdsRef,
    },
    sim,
  );

  const {
    clusterMenu,
    setClusterMenu,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handlePointerLeave,
    handleWheel,
  } = useGalaxyPointerHandlers({
    topCanvasRef,
    sizeRef,
    panRef,
    dragRef,
    pointersRef,
    hoveredRegionRef,
    selectedRegionRef,
    showRegionsRef,
    sim,
    onSelectSystem,
    onHoverSystem,
    onSelectRegion,
  });

  const { handleZoomIn, handleZoomOut } = useZoomControls(panRef, 0.1, 100);

  useGalaxyZoomHandle(ref, sim, panRef);

  const handleClusterSelect = useCallback(
    (id: string) => {
      onSelectSystem(id);
      setClusterMenu(null);
    },
    [onSelectSystem, setClusterMenu],
  );

  const handleToggleRegions = useCallback(() => {
    const next = !showRegionsRef.current;
    showRegionsRef.current = next;
    setShowRegions(next);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      <canvas
        ref={bgCanvasRef}
        style={{ position: "absolute", inset: 0, display: "block" }}
      />
      <canvas
        ref={topCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          cursor: "grab",
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
        onWheel={handleWheel}
      />
      <ClusterMenuPopup menu={clusterMenu} onSelect={handleClusterSelect} />
      <button
        className={regionsClass(showRegions)}
        onClick={handleToggleRegions}
        title="Toggle galactic region labels"
      >
        ✦ Regions
      </button>
      <ZoomControls onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />
      <div className="galaxy-hint">
        Scroll or pinch to zoom · Drag to pan · Tap to select
      </div>
    </div>
  );
}
