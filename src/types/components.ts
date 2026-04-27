import type { BodyId } from './bodies';

export type TabId = 'solar-system' | 'planet-view';

export interface SolarSystemCanvasProps {
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  trackedBody: BodyId | null;
  speed: number;
  paused: boolean;
  showOrbits: boolean;
  showLabels: boolean;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
  onTrackBody: (id: BodyId | null) => void;
}

export interface SolarSystemCanvasState {
  angles: Record<string, number>;
  positions: Record<string, { x: number; y: number }>;
  zoom: number;
  panX: number;
  panY: number;
  targetZoom: number;
  targetPanX: number;
  targetPanY: number;
  lastTime: number | null;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartPanX: number;
  dragStartPanY: number;
  userDragging: boolean;
  dragBrokeFree: boolean;
}

export interface PlanetViewCanvasProps {
  planetId: BodyId;
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  speed: number;
  paused: boolean;
  showLabels: boolean;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
}

export interface PlanetViewCanvasState {
  angles: Record<string, number>;
  positions: Record<string, { x: number; y: number }>;
  zoom: number;
  panX: number;
  panY: number;
  targetZoom: number;
  targetPanX: number;
  targetPanY: number;
  lastTime: number | null;
  dragging: boolean;
  dragStartX: number;
  dragStartY: number;
  dragStartPanX: number;
  dragStartPanY: number;
}

export interface InfoPanelProps {
  selectedBody: BodyId;
}

export interface StatRowProps {
  label: string;
  value: string | number | null | undefined;
}
