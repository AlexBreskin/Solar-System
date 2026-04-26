export type BodyId = string;

export type TabId = 'solar-system' | 'planet-view';

export type BodyType = 'star' | 'planet' | 'dwarf-planet' | 'moon' | 'asteroid' | 'belt';

export interface Vec2 {
  x: number;
  y: number;
}

export interface CanvasSize {
  w: number;
  h: number;
}

export interface CelestialBody {
  id: BodyId;
  name: string;
  type: BodyType;
  parent: BodyId | null;
  diameter: number;
  mass: string;
  distanceFromParent: number;
  orbitalPeriod: number;
  rotationPeriod: number;
  eccentricity: number;
  inclination: number;
  color: string;
  glowColor?: string;
  hasRings?: boolean;
  showOrbitRing?: boolean;
  atmosphereColor?: string;
  binaryMassFraction?: number;
  description: string;
  surfaceTemp: string;
  moons: number;
  funFact: string;
  atmosphere?: string;
}

export interface HierarchyNode {
  id: BodyId;
  children: HierarchyNode[];
}

export interface BeltConfig {
  innerRadius: number;
  outerRadius: number;
  particleCount: number;
  seed: number;
  color: string;
}

export interface VisualConfig {
  orbitalRadii: Record<string, number>;
  planetSizes: Record<string, number>;
  moonOrbitalRadii: Record<string, number>;
  speedMultiplier: number;
  moonSpeedMultiplier: number;
  beltConfigs: Record<string, BeltConfig>;
}

// SolarSystemCanvas

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
  positions: Record<string, Vec2>;
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

// PlanetViewCanvas

export interface PlanetViewLayout {
  planetR: number;
  moonSizes: Record<string, number>;
  moonOrbitalRadii: Record<string, number>;
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
  positions: Record<string, Vec2>;
  layout: PlanetViewLayout | null;
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

// InfoPanel

export interface InfoPanelProps {
  selectedBody: BodyId;
}

export interface StatRowProps {
  label: string;
  value: string | number | null | undefined;
}
