import React, { useRef, useEffect, useCallback } from "react";
import { CELESTIAL_BODIES } from "../data/celestialBodies";

const TWO_PI = Math.PI * 2;

const MOON_PARENT_MAP = {
  moon: "earth",
  phobos: "mars",
  deimos: "mars",
  io: "jupiter",
  europa: "jupiter",
  ganymede: "jupiter",
  callisto: "jupiter",
  titan: "saturn",
  enceladus: "saturn",
  triton: "neptune",
};

// Real orbital periods in days (negative = retrograde)
const MOON_PERIODS = {
  moon: 27.32,
  phobos: 0.319,
  deimos: 1.263,
  io: 1.769,
  europa: 3.551,
  ganymede: 7.155,
  callisto: 16.69,
  titan: 15.95,
  enceladus: 1.37,
  triton: -5.877,
};

function getMoonsOf(planetId) {
  return Object.entries(MOON_PARENT_MAP)
    .filter(([, parent]) => parent === planetId)
    .map(([moonId]) => moonId);
}

function lighten(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, r + amount)},${Math.min(255, g + amount)},${Math.min(255, b + amount)})`;
}

// Star field
let cachedStars = null;
function getStarField() {
  if (cachedStars) return cachedStars;
  const stars = [];
  let seed = 99991;
  const rng = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 250; i++) {
    stars.push([
      rng() * 2000,
      rng() * 1200,
      rng() * 1.0 + 0.2,
      rng() * 0.5 + 0.15,
    ]);
  }
  cachedStars = stars;
  return stars;
}

/**
 * Compute scaled sizes and orbital radii from real physical data.
 *
 * Strategy:
 *  1. Planet visual radius is clamped to [MIN_PLANET_R, MAX_PLANET_R] px.
 *  2. Moon visual radii scale proportionally to their real diameters vs the planet.
 *  3. Orbital radii scale proportionally to real distanceFromParent values,
 *     then the whole set is linearly scaled so the outermost orbit = FIT_RADIUS
 *     (a fraction of the canvas half-size), giving guaranteed fit.
 *  4. MIN_MOON_R ensures tiny moons are still visible.
 */
function computeScaledLayout(planetId, moons, canvasW, canvasH) {
  const planet = CELESTIAL_BODIES[planetId];
  const halfMin = Math.min(canvasW, canvasH) / 2;

  const MIN_PLANET_R = 28;
  const MAX_PLANET_R = halfMin * 0.22;
  const MIN_MOON_R = 3;
  const FIT_RADIUS = halfMin * 0.88; // outermost orbit sits here

  // Planet radius — use Sun diameter as reference ceiling for normalisation
  const SUN_DIAMETER = 1391016;
  const rawPlanetR = (planet.diameter / SUN_DIAMETER) * MAX_PLANET_R * 18;
  const planetR = Math.max(MIN_PLANET_R, Math.min(MAX_PLANET_R, rawPlanetR));

  // Moon radii — normalised against the largest moon in this scene so relative
  // sizes are accurate to each other. The largest moon is capped at a fraction
  // of the planet radius so moons never dwarf their parent.
  const MAX_MOON_R = Math.min(planetR * 0.28, halfMin * 0.08);
  const moonDiameters = moons.map((m) => CELESTIAL_BODIES[m]?.diameter || 1);
  const largestMoonDiam = moons.length ? Math.max(...moonDiameters) : 1;

  const moonSizes = {};
  for (const moonId of moons) {
    const moon = CELESTIAL_BODIES[moonId];
    if (!moon) continue;
    const ratio = moon.diameter / largestMoonDiam;
    moonSizes[moonId] = Math.max(MIN_MOON_R, ratio * MAX_MOON_R);
  }

  // Orbital radii — proportional to real distances, then scaled to fit canvas.
  // After computing proportional radii we do a second pass to ensure no two
  // adjacent orbits are so close that moons clip into each other.
  const moonOrbitalRadii = {};
  if (moons.length === 0) return { planetR, moonSizes, moonOrbitalRadii };

  // Sort moons by real distance so we can enforce minimum spacing in order
  const sortedMoons = [...moons].sort(
    (a, b) =>
      (CELESTIAL_BODIES[a]?.distanceFromParent || 0) -
      (CELESTIAL_BODIES[b]?.distanceFromParent || 0),
  );

  const realDistances = sortedMoons.map(
    (m) => CELESTIAL_BODIES[m]?.distanceFromParent || 0,
  );
  const maxRealDist = realDistances[realDistances.length - 1];
  const minRealDist = realDistances[0];
  const distRange = maxRealDist - minRealDist || 1;

  // First pass: proportional mapping
  // Inner orbit clears the planet body with a gap proportional to planetR
  const BASE_INNER = planetR + Math.max(planetR * 0.45, 20);
  for (const moonId of sortedMoons) {
    const d = CELESTIAL_BODIES[moonId]?.distanceFromParent || 0;
    const t = moons.length === 1 ? 0.5 : (d - minRealDist) / distRange;
    moonOrbitalRadii[moonId] = BASE_INNER + t * (FIT_RADIUS - BASE_INNER);
  }

  // Second pass: enforce minimum gap between adjacent orbits so moons don't clip.
  // Minimum gap = sum of the two neighbouring moon radii + a small padding.
  const MIN_GAP_PAD = 6;
  for (let i = 1; i < sortedMoons.length; i++) {
    const inner = sortedMoons[i - 1];
    const outer = sortedMoons[i];
    const minGap = moonSizes[inner] + moonSizes[outer] + MIN_GAP_PAD;
    if (moonOrbitalRadii[outer] - moonOrbitalRadii[inner] < minGap) {
      moonOrbitalRadii[outer] = moonOrbitalRadii[inner] + minGap;
    }
  }

  // Third pass: if pushing orbits outward caused the outermost to exceed FIT_RADIUS,
  // scale the entire set down uniformly so everything still fits.
  const outermostId = sortedMoons[sortedMoons.length - 1];
  const outermostR = moonOrbitalRadii[outermostId];
  if (outermostR > FIT_RADIUS) {
    const scale = FIT_RADIUS / outermostR;
    for (const moonId of sortedMoons) {
      moonOrbitalRadii[moonId] *= scale;
    }
  }

  return { planetR, moonSizes, moonOrbitalRadii };
}

export default function PlanetViewCanvas({
  planetId,
  selectedBody,
  hoveredBody,
  speed,
  paused,
  showLabels,
  onSelectBody,
  onHoverBody,
}) {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const animRef = useRef(null);
  const stateRef = useRef({
    angles: {},
    positions: {},
    layout: null, // cached layout for current planet + canvas size
    zoom: 1,
    panX: 0,
    panY: 0,
    targetZoom: 1,
    targetPanX: 0,
    targetPanY: 0,
    lastTime: null,
    dragging: false,
    dragStartX: 0,
    dragStartY: 0,
    dragStartPanX: 0,
    dragStartPanY: 0,
  });

  const planet = CELESTIAL_BODIES[planetId];
  const moons = getMoonsOf(planetId);

  // Reset angles + camera when planet changes
  useEffect(() => {
    const st = stateRef.current;
    moons.forEach((m, i) => {
      if (st.angles[m] === undefined)
        st.angles[m] = i * (TWO_PI / Math.max(moons.length, 1));
    });
    st.layout = null; // force recompute
    st.targetZoom = 1;
    st.targetPanX = 0;
    st.targetPanY = 0;
    st.zoom = 1;
    st.panX = 0;
    st.panY = 0;
  }, [planetId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        canvas.width = width * window.devicePixelRatio;
        canvas.height = height * window.devicePixelRatio;
        canvas.style.width = width + "px";
        canvas.style.height = height + "px";
        sizeRef.current = { w: width, h: height };
        stateRef.current.layout = null; // recompute on resize
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    const dpr = window.devicePixelRatio;

    const fastestPeriod = moons.length
      ? Math.min(...moons.map((m) => Math.abs(MOON_PERIODS[m] || 27.32)))
      : 27.32;

    function draw(ts) {
      animRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      const dt = st.lastTime ? Math.min((ts - st.lastTime) / 1000, 0.1) : 0;
      st.lastTime = ts;

      // Advance angles
      if (!paused) {
        const baseSpeed = 0.4 * speed;
        for (const moonId of moons) {
          const period = MOON_PERIODS[moonId];
          if (!period) continue;
          const relSpeed =
            (fastestPeriod / Math.abs(period)) * Math.sign(period);
          st.angles[moonId] =
            (st.angles[moonId] || 0) + relSpeed * baseSpeed * dt;
        }
      }

      // Recompute layout if needed (planet changed or canvas resized)
      if (!st.layout) {
        st.layout = computeScaledLayout(planetId, moons, w, h);
      }
      const { planetR, moonSizes, moonOrbitalRadii } = st.layout;

      // Compute positions
      const cx = w / 2;
      const cy = h / 2;
      const pos = {};
      pos[planetId] = { x: cx, y: cy };
      for (const moonId of moons) {
        const r = moonOrbitalRadii[moonId] || 80;
        pos[moonId] = {
          x: cx + r * Math.cos(st.angles[moonId] || 0),
          y: cy + r * Math.sin(st.angles[moonId] || 0),
        };
      }
      st.positions = pos;

      // Smooth pan/zoom
      st.panX += (st.targetPanX - st.panX) * 0.1;
      st.panY += (st.targetPanY - st.panY) * 0.1;
      st.zoom += (st.targetZoom - st.zoom) * 0.1;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#050812";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      // Stars
      for (const [sx, sy, sr, sa] of getStarField()) {
        ctx.globalAlpha = sa;
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, TWO_PI);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Pan/zoom transform
      ctx.save();
      ctx.translate(cx + st.panX, cy + st.panY);
      ctx.scale(st.zoom, st.zoom);
      ctx.translate(-cx, -cy);

      // Moon orbit rings
      for (const moonId of moons) {
        const r = moonOrbitalRadii[moonId] || 80;
        const isHighlighted = moonId === selectedBody || moonId === hoveredBody;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, TWO_PI);
        ctx.strokeStyle = isHighlighted
          ? "rgba(255,255,255,0.35)"
          : "rgba(255,255,255,0.18)";
        ctx.lineWidth = isHighlighted ? 1 : 0.5;
        ctx.setLineDash(isHighlighted ? [] : [3, 8]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Saturn rings (behind)
      if (planetId === "saturn") drawSaturnRings(ctx, cx, cy, planetR, "back");

      // Planet
      drawBody(
        ctx,
        planetId,
        cx,
        cy,
        planetR,
        selectedBody === planetId,
        hoveredBody === planetId,
        true,
      );

      // Saturn rings (front)
      if (planetId === "saturn") drawSaturnRings(ctx, cx, cy, planetR, "front");

      // Moons
      for (const moonId of moons) {
        const p = pos[moonId];
        const mr = moonSizes[moonId] || 5;
        drawBody(
          ctx,
          moonId,
          p.x,
          p.y,
          mr,
          selectedBody === moonId,
          hoveredBody === moonId,
          showLabels || selectedBody === moonId || hoveredBody === moonId,
        );
      }

      ctx.restore();
      ctx.restore();
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [planetId, moons, selectedBody, hoveredBody, speed, paused, showLabels]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Drawing helpers ──────────────────────

  function drawBody(ctx, id, x, y, r, isSelected, isHovered, showLabel) {
    const body = CELESTIAL_BODIES[id];
    if (!body) return;

    // Glow
    if (isSelected || isHovered) {
      const glowR = r * (isSelected ? 2.8 : 2.2);
      const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowR);
      grad.addColorStop(0, (body.glowColor || body.color) + "55");
      grad.addColorStop(1, (body.glowColor || body.color) + "00");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, glowR, 0, TWO_PI);
      ctx.fill();
    }

    if (id === "sun") {
      const corona = ctx.createRadialGradient(x, y, r, x, y, r * 2.8);
      corona.addColorStop(0, "rgba(255,160,0,0.3)");
      corona.addColorStop(1, "rgba(255,80,0,0)");
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.8, 0, TWO_PI);
      ctx.fill();
    }

    const grad = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.3,
      r * 0.1,
      x,
      y,
      r,
    );
    if (id === "sun") {
      grad.addColorStop(0, "#FFF5AA");
      grad.addColorStop(0.4, "#FDB813");
      grad.addColorStop(1, "#E07B00");
    } else {
      grad.addColorStop(0, lighten(body.color, 40));
      grad.addColorStop(1, body.color);
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();

    if (id === "earth") {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.strokeStyle = "rgba(100,180,255,0.4)";
      ctx.lineWidth = Math.max(1, r * 0.1);
      ctx.stroke();
    }

    if (isSelected) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, r + Math.max(4, r * 0.15), 0, TWO_PI);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isHovered) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.stroke();
    }

    if (showLabel) {
      const fontSize = Math.max(10, Math.min(14, r * 0.7));
      ctx.font = `${isSelected ? 600 : 400} ${fontSize}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,210,230,0.85)";
      ctx.textAlign = "center";
      ctx.fillText(body.name, x, y - r - Math.max(5, r * 0.2));
    }
  }

  function drawSaturnRings(ctx, cx, cy, r, pass) {
    // Ring dimensions scale with the planet radius
    const rings = [
      { inner: r * 1.1, outer: r * 1.3, color: "rgba(200,180,140,0.5)" },
      { inner: r * 1.33, outer: r * 1.55, color: "rgba(220,200,160,0.4)" },
      { inner: r * 1.58, outer: r * 1.75, color: "rgba(180,160,120,0.3)" },
    ];
    const step = Math.max(0.5, r * 0.02);
    for (const ring of rings) {
      for (let ra = ring.inner; ra <= ring.outer; ra += step) {
        ctx.beginPath();
        if (pass === "back") {
          ctx.ellipse(cx, cy, ra, ra * 0.38, 0, Math.PI, TWO_PI);
        } else {
          ctx.ellipse(cx, cy, ra, ra * 0.38, 0, 0, Math.PI);
        }
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  // ─── Hit test ─────────────────────────────

  const getBodyAtPoint = useCallback(
    (canvasX, canvasY) => {
      const st = stateRef.current;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;
      const wx = (canvasX - cx - st.panX) / st.zoom + cx;
      const wy = (canvasY - cy - st.panY) / st.zoom + cy;
      if (!st.layout) return null;
      const { planetR, moonSizes } = st.layout;

      let closest = null,
        closestDist = Infinity;
      for (const [id, p] of Object.entries(st.positions)) {
        const r = Math.max((id === planetId ? planetR : moonSizes[id]) || 5, 8);
        const dist = Math.hypot(wx - p.x, wy - p.y);
        if (dist < r * 1.6 && dist < closestDist) {
          closest = id;
          closestDist = dist;
        }
      }
      return closest;
    },
    [planetId],
  );

  // ─── Mouse / wheel handlers ────────────────

  const handleMouseMove = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      const st = stateRef.current;
      if (st.dragging) {
        st.targetPanX = st.dragStartPanX + (x - st.dragStartX);
        st.targetPanY = st.dragStartPanY + (y - st.dragStartY);
      } else {
        const hit = getBodyAtPoint(x, y);
        onHoverBody(hit);
        canvasRef.current.style.cursor = hit ? "pointer" : "grab";
      }
    },
    [getBodyAtPoint, onHoverBody],
  );

  const handleMouseDown = useCallback((e) => {
    const st = stateRef.current;
    st.dragging = true;
    st.dragStartX = e.clientX - canvasRef.current.getBoundingClientRect().left;
    st.dragStartY = e.clientY - canvasRef.current.getBoundingClientRect().top;
    st.dragStartPanX = st.targetPanX;
    st.dragStartPanY = st.targetPanY;
    canvasRef.current.style.cursor = "grabbing";
  }, []);

  const handleMouseUp = useCallback(
    (e) => {
      const st = stateRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left,
        y = e.clientY - rect.top;
      if (Math.abs(x - st.dragStartX) + Math.abs(y - st.dragStartY) < 5) {
        const hit = getBodyAtPoint(x, y);
        if (hit) onSelectBody(hit);
      }
      st.dragging = false;
      canvasRef.current.style.cursor = "grab";
    },
    [getBodyAtPoint, onSelectBody],
  );

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const st = stateRef.current;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left,
      my = e.clientY - rect.top;
    const { w, h } = sizeRef.current;
    const cx = w / 2,
      cy = h / 2;
    const newZoom = Math.max(
      0.2,
      Math.min(8, st.targetZoom * (e.deltaY > 0 ? 0.9 : 1.1)),
    );
    const zoomRatio = newZoom / st.targetZoom;
    st.targetPanX = mx - zoomRatio * (mx - (cx + st.targetPanX)) - cx;
    st.targetPanY = my - zoomRatio * (my - (cy + st.targetPanY)) - cy;
    st.targetZoom = newZoom;
  }, []);

  const handleMouseLeave = useCallback(() => {
    onHoverBody(null);
    stateRef.current.dragging = false;
  }, [onHoverBody]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          cursor: "grab",
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
      />
      {moons.length === 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, calc(-50% + 70px))",
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "Syne, sans-serif",
            pointerEvents: "none",
            textAlign: "center",
          }}
        >
          {planet?.name} has no known moons in this simulation
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          fontSize: 11,
          color: "rgba(255,255,255,0.25)",
          fontFamily: "Syne, sans-serif",
          pointerEvents: "none",
          lineHeight: 1.8,
        }}
      >
        Scroll to zoom · Drag to pan · Click to select
      </div>
    </div>
  );
}
