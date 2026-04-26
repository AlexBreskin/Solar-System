export type BodyId =
  | 'sun' | 'mercury' | 'venus' | 'earth' | 'moon'
  | 'mars' | 'phobos' | 'deimos' | 'ceres'
  | 'jupiter' | 'io' | 'europa' | 'ganymede' | 'callisto'
  | 'saturn' | 'titan' | 'enceladus'
  | 'uranus' | 'neptune' | 'triton' | 'pluto';

export type TabId = 'solar-system' | 'planet-view';

export type BodyType = 'star' | 'planet' | 'dwarf-planet' | 'moon';

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

export interface VisualConfig {
  orbitalRadii: Partial<Record<BodyId, number>>;
  planetSizes: Partial<Record<BodyId, number>>;
  moonOrbitalRadii: Partial<Record<BodyId, number>>;
  speedMultiplier: number;
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
  angles: Partial<Record<BodyId, number>>;
  positions: Partial<Record<BodyId, Vec2>>;
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
  moonSizes: Partial<Record<BodyId, number>>;
  moonOrbitalRadii: Partial<Record<BodyId, number>>;
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
  angles: Partial<Record<BodyId, number>>;
  positions: Partial<Record<BodyId, Vec2>>;
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

// Outliner

export interface OutlinerProps {
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
  filterIds: BodyId[] | null;
}

export interface OutlinerNodeProps {
  node: HierarchyNode;
  depth: number;
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
  defaultOpen?: boolean;
}

export interface FlatOutlinerRowProps {
  id: BodyId;
  selectedBody: BodyId;
  hoveredBody: BodyId | null;
  onSelectBody: (id: BodyId) => void;
  onHoverBody: (id: BodyId | null) => void;
  isPlanet: boolean;
}

// InfoPanel

export interface InfoPanelProps {
  selectedBody: BodyId;
}

export interface StatRowProps {
  label: string;
  value: string | number | null | undefined;
}

// PlanetSelector

export interface PlanetSelectorProps {
  planetId: BodyId;
  onSelectPlanet: (id: BodyId) => void;
}
