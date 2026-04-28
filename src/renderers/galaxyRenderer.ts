import { mulberry32 } from '../utils/mulberry32';
import type { GalaxyMarker } from '../simulation/galaxySimulation';

const TWO_PI = Math.PI * 2;

type GalParticle = [number, number, number];

let cachedBgParticles: GalParticle[] | null = null;

function getBgParticles(): GalParticle[] {
  if (cachedBgParticles) return cachedBgParticles;
  const rng = mulberry32(77777);
  const particles: GalParticle[] = [];

  for (let i = 0; i < 600; i++) {
    const r = Math.pow(rng(), 0.5) * 5000;
    const theta = rng() * TWO_PI;
    particles.push([r * Math.cos(theta), r * Math.sin(theta), rng() * 0.5 + 0.2]);
  }

  const armCount = 4;
  for (let a = 0; a < armCount; a++) {
    const armOffset = (a / armCount) * TWO_PI;
    const pCount = 2000;
    for (let i = 0; i < pCount; i++) {
      const t = (i / pCount) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 52000) continue;
      const scatter = (rng() * 2 - 1) * r * 0.1;
      const thetaJitter = (rng() - 0.5) * 0.2;
      const theta = t + armOffset + thetaJitter;
      const px = (r + scatter) * Math.cos(theta);
      const py = (r + scatter) * Math.sin(theta);
      particles.push([px, py, (rng() * 0.18 + 0.03)]);
    }
  }

  for (let i = 0; i < 300; i++) {
    const r = 15000 + rng() * 35000;
    const theta = rng() * TWO_PI;
    particles.push([r * Math.cos(theta), r * Math.sin(theta), rng() * 0.05 + 0.01]);
  }

  cachedBgParticles = particles;
  return particles;
}

export function drawGalaxyBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  gcx: number,
  gcy: number,
  scale: number,
): void {
  ctx.fillStyle = '#020509';
  ctx.fillRect(0, 0, w, h);

  const diskR = 50000 * scale;
  if (diskR > 1) {
    const disk = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, diskR);
    disk.addColorStop(0, 'rgba(120,145,240,0.09)');
    disk.addColorStop(0.5, 'rgba(70,95,190,0.05)');
    disk.addColorStop(0.85, 'rgba(40,60,140,0.02)');
    disk.addColorStop(1, 'rgba(20,30,80,0)');
    ctx.fillStyle = disk;
    ctx.beginPath();
    ctx.arc(gcx, gcy, diskR, 0, TWO_PI);
    ctx.fill();
  }

  const armColors = [
    'rgba(140,170,255,0.07)',
    'rgba(120,155,240,0.055)',
    'rgba(140,170,255,0.07)',
    'rgba(120,155,240,0.055)',
  ];
  for (let a = 0; a < 4; a++) {
    const armOffset = (a / 4) * TWO_PI;
    const armWidth = Math.max(2, 3500 * scale);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i <= 300; i++) {
      const t = (i / 300) * Math.PI * 4.5 + 0.4;
      const r = 2000 * Math.exp(0.22 * t);
      if (r > 52000) break;
      const theta = t + armOffset;
      const px = gcx + r * Math.cos(theta) * scale;
      const py = gcy - r * Math.sin(theta) * scale;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.strokeStyle = armColors[a];
    ctx.lineWidth = armWidth;
    ctx.stroke();
  }

  ctx.fillStyle = '#C4D4FF';
  for (const [galX, galY, brightness] of getBgParticles()) {
    const px = gcx + galX * scale;
    const py = gcy - galY * scale;
    if (px < -1 || px > w + 1 || py < -1 || py > h + 1) continue;
    ctx.globalAlpha = brightness;
    ctx.fillRect(px, py, 1, 1);
  }
  ctx.globalAlpha = 1;

  const bulgeR = Math.max(6, 5000 * scale);
  const bulge = ctx.createRadialGradient(gcx, gcy, 0, gcx, gcy, bulgeR);
  bulge.addColorStop(0, 'rgba(255,245,200,0.95)');
  bulge.addColorStop(0.15, 'rgba(255,210,140,0.60)');
  bulge.addColorStop(0.4, 'rgba(220,170,100,0.25)');
  bulge.addColorStop(1, 'rgba(180,120,60,0)');
  ctx.fillStyle = bulge;
  ctx.beginPath();
  ctx.arc(gcx, gcy, bulgeR, 0, TWO_PI);
  ctx.fill();
}

function markerCanvasPos(
  worldX: number,
  worldY: number,
  cx: number,
  cy: number,
  panX: number,
  panY: number,
  scale: number,
): [number, number] {
  return [cx + panX + worldX * scale, cy + panY - worldY * scale];
}

export function drawSystemMarkers(
  ctx: CanvasRenderingContext2D,
  markers: GalaxyMarker[],
  hoveredId: string | null,
  selectedId: string | null,
  cx: number,
  cy: number,
  panX: number,
  panY: number,
  scale: number,
  ts: number,
): void {
  for (const m of markers) {
    const [mx, my] = markerCanvasPos(m.worldX, m.worldY, cx, cy, panX, panY, scale);
    const isHovered = m.id === hoveredId;
    const isSelected = m.id === selectedId;
    const isSol = m.id === 'sol';
    const baseR = isSol ? 5 : 3.5;
    const r = baseR * (isHovered ? 1.4 : 1);

    if (isSelected) {
      const pulseScale = 1 + 0.3 * Math.sin(ts * 0.003);
      const glowR = r * 3.5 * pulseScale;
      const glow = ctx.createRadialGradient(mx, my, r, mx, my, glowR);
      glow.addColorStop(0, m.starColor + '55');
      glow.addColorStop(1, m.starColor + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, glowR, 0, TWO_PI);
      ctx.fill();
    } else if (isHovered) {
      const glowR = r * 2.8;
      const glow = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, glowR);
      glow.addColorStop(0, m.starColor + '40');
      glow.addColorStop(1, m.starColor + '00');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(mx, my, glowR, 0, TWO_PI);
      ctx.fill();
    }

    if (m.rootType === 'black-hole') {
      const ring = ctx.createRadialGradient(mx, my, r * 0.4, mx, my, r * 2.2);
      ring.addColorStop(0, 'rgba(220,110,30,0.75)');
      ring.addColorStop(1, 'rgba(180,70,10,0)');
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(mx, my, r * 2.2, 0, TWO_PI);
      ctx.fill();
      ctx.fillStyle = '#050202';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, TWO_PI);
      ctx.fill();
    } else if (m.rootType === 'neutron-star') {
      const grad = ctx.createRadialGradient(mx, my, 0, mx, my, r * 1.6);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.3, '#B8D8FF');
      grad.addColorStop(1, 'rgba(80,140,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, r * 1.6, 0, TWO_PI);
      ctx.fill();
    } else {
      const grad = ctx.createRadialGradient(mx - r * 0.25, my - r * 0.25, 0, mx, my, r);
      grad.addColorStop(0, '#FFFFFF');
      grad.addColorStop(0.45, m.starColor);
      grad.addColorStop(1, m.starColor + 'AA');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, TWO_PI);
      ctx.fill();
    }

    if (isSelected) {
      ctx.strokeStyle = m.starColor + 'CC';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(mx, my, r + 3, 0, TWO_PI);
      ctx.stroke();
    }

    const showLabel = isSol || isHovered || isSelected;
    if (showLabel) {
      ctx.font = `${isSelected ? 600 : 400} ${isSelected ? 12 : 11}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(200,215,240,0.9)';
      ctx.textAlign = 'center';
      ctx.fillText(m.name, mx, my - r - 6);
    }
  }
}
