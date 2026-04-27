export interface Vec2 {
  x: number;
  y: number;
}

export interface CanvasSize {
  w: number;
  h: number;
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

export interface PlanetViewLayout {
  planetR: number;
  moonSizes: Record<string, number>;
  moonOrbitalRadii: Record<string, number>;
}
