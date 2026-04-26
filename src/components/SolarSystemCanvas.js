import React, { useRef, useEffect, useCallback, useState } from "react";
import { CELESTIAL_BODIES, VISUAL_CONFIG } from "../data/celestialBodies";

const TWO_PI = Math.PI * 2;

// Compute all body positions given angles
function computePositions(angles, cx, cy) {
  const pos = {};
  const { orbitalRadii, moonOrbitalRadii } = VISUAL_CONFIG;

  // Sun
  pos["sun"] = { x: cx, y: cy };

  // Planets
  const planets = [
    "mercury",
    "venus",
    "earth",
    "mars",
    "ceres",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
  ];
  for (const p of planets) {
    const r = orbitalRadii[p];
    pos[p] = {
      x: cx + r * Math.cos(angles[p]),
      y: cy + r * Math.sin(angles[p]),
    };
  }

  // Moons
  const moons = {
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
  for (const [moon, parent] of Object.entries(moons)) {
    const pr = moonOrbitalRadii[moon];
    const px = pos[parent].x;
    const py = pos[parent].y;
    pos[moon] = {
      x: px + pr * Math.cos(angles[moon]),
      y: py + pr * Math.sin(angles[moon]),
    };
  }

  return pos;
}

// Orbital speed ratios relative to Earth
const ORBITAL_SPEEDS = {
  mercury: 365.25 / 87.97,
  venus: 365.25 / 224.7,
  earth: 1.0,
  mars: 365.25 / 686.97,
  ceres: 365.25 / 1681.63,
  jupiter: 365.25 / 4332.59,
  saturn: 365.25 / 10759.22,
  uranus: 365.25 / 30688.5,
  neptune: 365.25 / 60195,
  pluto: 365.25 / 90560,
  // Moons — relative to Earth's orbital speed scaled for visibility
  moon: (365.25 / 27.32) * 0.1,
  phobos: (365.25 / 0.319) * 0.05,
  deimos: (365.25 / 1.263) * 0.05,
  io: (365.25 / 1.769) * 0.05,
  europa: (365.25 / 3.551) * 0.05,
  ganymede: (365.25 / 7.155) * 0.05,
  callisto: (365.25 / 16.69) * 0.05,
  titan: (365.25 / 15.95) * 0.05,
  enceladus: (365.25 / 1.37) * 0.05,
  triton: -(365.25 / 5.877) * 0.05,
};

export default function SolarSystemCanvas({
  selectedBody,
  hoveredBody,
  trackedBody,
  speed,
  paused,
  showOrbits,
  showLabels,
  onSelectBody,
  onHoverBody,
  onTrackBody,
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    angles: Object.fromEntries(
      Object.keys(ORBITAL_SPEEDS).map((k, i) => [k, i * 0.7]),
    ),
    positions: {},
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
    userDragging: false, // true while user is actively dragging — suppresses tracking
  });
  const animFrameRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const sizeRef = useRef({ w: 0, h: 0 });

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
        setCanvasSize({ w: width, h: height });
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Track body — animate camera to follow
  useEffect(() => {
    if (!trackedBody) return;
    // Camera will update each frame in the draw loop
  }, [trackedBody]);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const st = stateRef.current;
    const dpr = window.devicePixelRatio;

    function draw(ts) {
      animFrameRef.current = requestAnimationFrame(draw);
      const { w, h } = sizeRef.current;
      if (!w || !h) return;

      const dt = st.lastTime ? Math.min((ts - st.lastTime) / 1000, 0.1) : 0;
      st.lastTime = ts;

      // Advance angles
      if (!paused) {
        const baseSpeed = 0.25 * speed;
        for (const [id, rate] of Object.entries(ORBITAL_SPEEDS)) {
          st.angles[id] = (st.angles[id] || 0) + rate * baseSpeed * dt;
        }
      }

      const cx = w / 2;
      const cy = h / 2;
      st.positions = computePositions(st.angles, cx, cy);

      // If tracking and user is not dragging, pan camera to keep body centered
      if (trackedBody && st.positions[trackedBody] && !st.userDragging) {
        const bp = st.positions[trackedBody];
        const targetX = cx - bp.x;
        const targetY = cy - bp.y;
        st.targetPanX += (targetX - st.targetPanX) * 0.08;
        st.targetPanY += (targetY - st.targetPanY) * 0.08;
      }

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

      // Stars background (static)
      drawStars(ctx, w, h);

      // Transform for pan/zoom
      ctx.save();
      ctx.translate(cx + st.panX, cy + st.panY);
      ctx.scale(st.zoom, st.zoom);
      ctx.translate(-cx, -cy);

      // Draw orbits — faint ones always visible, highlighted ones bright. Toggle hides all.
      if (showOrbits) {
        drawOrbits(ctx, cx, cy, selectedBody, hoveredBody, true);
      } else {
        // Even with orbits off, draw a subtle highlight for the selected/hovered body
        drawOrbits(ctx, cx, cy, selectedBody, hoveredBody, false);
      }

      // Draw Saturn rings (behind planet)
      drawSaturnRings(ctx, st.positions, "back");

      // Draw bodies
      drawBodies(ctx, st.positions, selectedBody, hoveredBody, showLabels);

      // Draw Saturn rings (front)
      drawSaturnRings(ctx, st.positions, "front");

      ctx.restore();
      ctx.restore();
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    selectedBody,
    hoveredBody,
    trackedBody,
    speed,
    paused,
    showOrbits,
    showLabels,
  ]);

  function drawStars(ctx, w, h) {
    // Use a seeded deterministic set of stars
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    const stars = getStarField(w, h);
    for (const [x, y, r, a] of stars) {
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TWO_PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawOrbits(ctx, cx, cy, selected, hovered, showAll) {
    const { orbitalRadii } = VISUAL_CONFIG;
    const planets = [
      "mercury",
      "venus",
      "earth",
      "mars",
      "ceres",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto",
    ];

    for (const p of planets) {
      const r = orbitalRadii[p];
      const isHighlighted = p === selected || p === hovered;

      if (!showAll && !isHighlighted) continue; // skip faint orbits when toggle is off

      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TWO_PI);
      if (isHighlighted) {
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      } else {
        ctx.strokeStyle = "rgba(255,255,255,0.30)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 8]);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawBodies(ctx, positions, selected, hovered, labels) {
    const { planetSizes } = VISUAL_CONFIG;
    const allBodies = Object.keys(CELESTIAL_BODIES);

    // Draw glow for selected
    for (const id of allBodies) {
      if (!positions[id]) continue;
      const body = CELESTIAL_BODIES[id];
      const pos = positions[id];
      const r = planetSizes[id] || 4;
      const isSelected = id === selected;
      const isHovered = id === hovered;

      if (isSelected || isHovered) {
        const glowR = r + (isSelected ? 10 : 6);
        const grad = ctx.createRadialGradient(
          pos.x,
          pos.y,
          r * 0.5,
          pos.x,
          pos.y,
          glowR * 2,
        );
        const col = body.glowColor || body.color;
        grad.addColorStop(0, col + "60");
        grad.addColorStop(1, col + "00");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, glowR * 2, 0, TWO_PI);
        ctx.fill();
      }
    }

    // Draw moon orbits
    const moonParentMap = {
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
    const { moonOrbitalRadii } = VISUAL_CONFIG;

    for (const [moon, parent] of Object.entries(moonParentMap)) {
      if (!positions[parent]) continue;
      const pp = positions[parent];
      const r = moonOrbitalRadii[moon];
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, r, 0, TWO_PI);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Draw all celestial bodies
    for (const id of allBodies) {
      if (!positions[id]) continue;
      const body = CELESTIAL_BODIES[id];
      if (id === "saturn") continue; // drawn separately with rings
      const pos = positions[id];
      const r = planetSizes[id] || 4;
      const isSelected = id === selected;
      const isHovered = id === hovered;

      if (id === "sun") {
        drawSun(ctx, pos.x, pos.y, r, isSelected || isHovered);
      } else {
        // Planet / moon circle
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, TWO_PI);

        // Fill
        const grad = ctx.createRadialGradient(
          pos.x - r * 0.3,
          pos.y - r * 0.3,
          r * 0.1,
          pos.x,
          pos.y,
          r,
        );
        grad.addColorStop(0, lighten(body.color, 40));
        grad.addColorStop(1, body.color);
        ctx.fillStyle = grad;
        ctx.fill();

        // Border for selected/hovered
        if (isSelected) {
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else if (isHovered) {
          ctx.strokeStyle = "rgba(255,255,255,0.6)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Earth blue shine
        if (id === "earth") {
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
          ctx.strokeStyle = "rgba(100,180,255,0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Labels
      if (labels || isSelected || isHovered) {
        ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
        ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,210,230,0.7)";
        ctx.textAlign = "center";
        ctx.fillText(body.name, pos.x, pos.y - r - 5);
      }

      // Selection ring
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Saturn last (without rings here — rings handled separately)
    if (positions["saturn"]) {
      drawSaturnBody(
        ctx,
        positions["saturn"],
        selected === "saturn",
        hovered === "saturn",
        labels,
      );
    }
  }

  function drawSun(ctx, x, y, r, active) {
    // Outer corona
    const corona = ctx.createRadialGradient(x, y, r, x, y, r * 3.5);
    corona.addColorStop(0, "rgba(255, 160, 0, 0.3)");
    corona.addColorStop(0.5, "rgba(255, 100, 0, 0.1)");
    corona.addColorStop(1, "rgba(255, 80, 0, 0)");
    ctx.fillStyle = corona;
    ctx.beginPath();
    ctx.arc(x, y, r * 3.5, 0, TWO_PI);
    ctx.fill();

    // Main body gradient
    const grad = ctx.createRadialGradient(
      x - r * 0.3,
      y - r * 0.3,
      r * 0.1,
      x,
      y,
      r,
    );
    grad.addColorStop(0, "#FFF5AA");
    grad.addColorStop(0.4, "#FDB813");
    grad.addColorStop(1, "#E07B00");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TWO_PI);
    ctx.fill();

    if (active) {
      ctx.strokeStyle = "rgba(255, 200, 80, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function drawSaturnBody(ctx, pos, isSelected, isHovered, labels) {
    const r = VISUAL_CONFIG.planetSizes["saturn"];
    const body = CELESTIAL_BODIES["saturn"];
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, TWO_PI);
    const grad = ctx.createRadialGradient(
      pos.x - r * 0.3,
      pos.y - r * 0.3,
      r * 0.1,
      pos.x,
      pos.y,
      r,
    );
    grad.addColorStop(0, lighten(body.color, 40));
    grad.addColorStop(1, body.color);
    ctx.fillStyle = grad;
    ctx.fill();
    if (isSelected) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, r + 5, 0, TWO_PI);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 0.5;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (isHovered) {
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    if (labels || isSelected || isHovered) {
      ctx.font = `${isSelected ? 500 : 400} ${isSelected ? 11 : 10}px Syne, sans-serif`;
      ctx.fillStyle = isSelected ? "#ffffff" : "rgba(200,210,230,0.7)";
      ctx.textAlign = "center";
      ctx.fillText("Saturn", pos.x, pos.y - r - 14);
    }
  }

  function drawSaturnRings(ctx, positions, pass) {
    const pos = positions["saturn"];
    if (!pos) return;
    const r = VISUAL_CONFIG.planetSizes["saturn"];

    ctx.save();
    ctx.translate(pos.x, pos.y);

    // Ellipse rings (tilted view)
    const rings = [
      { inner: r + 3, outer: r + 8, color: "rgba(200,180,140,0.5)" },
      { inner: r + 9, outer: r + 14, color: "rgba(220,200,160,0.4)" },
      { inner: r + 15, outer: r + 19, color: "rgba(180,160,120,0.3)" },
    ];

    for (const ring of rings) {
      for (let ra = ring.inner; ra <= ring.outer; ra += 0.5) {
        ctx.beginPath();
        ctx.ellipse(0, 0, ra, ra * 0.38, 0, 0, TWO_PI);
        if (pass === "back") {
          // Only upper half (behind planet)
          ctx.beginPath();
          ctx.ellipse(0, 0, ra, ra * 0.38, 0, Math.PI, TWO_PI);
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        } else {
          // Lower half (in front of planet)
          ctx.beginPath();
          ctx.ellipse(0, 0, ra, ra * 0.38, 0, 0, Math.PI);
          ctx.strokeStyle = ring.color;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    ctx.restore();
  }

  // ─── Hit test ────────────────────────────
  const getBodyAtPoint = useCallback((canvasX, canvasY) => {
    const st = stateRef.current;
    const { w, h } = sizeRef.current;
    const cx = w / 2;
    const cy = h / 2;

    // Invert transform
    const wx = (canvasX - cx - st.panX) / st.zoom + cx;
    const wy = (canvasY - cy - st.panY) / st.zoom + cy;

    const { planetSizes } = VISUAL_CONFIG;
    let closest = null;
    let closestDist = Infinity;

    for (const [id, pos] of Object.entries(st.positions)) {
      if (!CELESTIAL_BODIES[id]) continue;
      const r = Math.max(planetSizes[id] || 4, 8); // min hit area
      const dx = wx - pos.x;
      const dy = wy - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < r * 1.5 && dist < closestDist) {
        closest = id;
        closestDist = dist;
      }
    }
    return closest;
  }, []);

  // ─── Mouse events ─────────────────────────
  const handleMouseMove = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const st = stateRef.current;

      if (st.dragging) {
        const dx = x - st.dragStartX;
        const dy = y - st.dragStartY;
        // Once the user has moved more than 4px, consider it a real drag
        // and kill tracking via React state so the draw loop stops overriding pan
        if (!st.dragBrokeFree && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          st.dragBrokeFree = true;
          onTrackBody(null); // clears trackedBody in React state
        }
        st.targetPanX = st.dragStartPanX + dx;
        st.targetPanY = st.dragStartPanY + dy;
      } else {
        const hit = getBodyAtPoint(x, y);
        onHoverBody(hit);
        canvasRef.current.style.cursor = hit ? "pointer" : "grab";
      }
    },
    [getBodyAtPoint, onHoverBody, onTrackBody],
  );

  const handleMouseDown = useCallback((e) => {
    const st = stateRef.current;
    st.dragging = true;
    st.userDragging = true;
    st.dragBrokeFree = false;
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
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const moved = Math.abs(x - st.dragStartX) + Math.abs(y - st.dragStartY);

      if (moved < 5) {
        const hit = getBodyAtPoint(x, y);
        if (hit) {
          onSelectBody(hit);
          // Zoom in if we're zoomed out
          if (st.targetZoom < 1.5 && hit !== "sun") {
            st.targetZoom = Math.min(2.5, st.targetZoom * 1.8);
          }
        }
      }
      st.dragging = false;
      st.userDragging = false;
      st.dragBrokeFree = false;
      canvasRef.current.style.cursor = "grab";
    },
    [getBodyAtPoint, onSelectBody],
  );

  const handleWheel = useCallback(
    (e) => {
      e.preventDefault();
      const st = stateRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const { w, h } = sizeRef.current;
      const cx = w / 2;
      const cy = h / 2;

      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.3, Math.min(8, st.targetZoom * zoomFactor));
      const zoomRatio = newZoom / st.targetZoom;

      if (trackedBody && st.positions[trackedBody]) {
        // When tracking, zoom toward the tracked body so it stays centred
        const bp = st.positions[trackedBody];
        const screenBx = cx + st.targetPanX + (bp.x - cx) * st.targetZoom;
        const screenBy = cy + st.targetPanY + (bp.y - cy) * st.targetZoom;
        st.targetPanX =
          screenBx - zoomRatio * (screenBx - (cx + st.targetPanX)) - cx;
        st.targetPanY =
          screenBy - zoomRatio * (screenBy - (cy + st.targetPanY)) - cy;
      } else {
        // Normal mode — zoom toward the mouse cursor
        st.targetPanX = mx - zoomRatio * (mx - (cx + st.targetPanX)) - cx;
        st.targetPanY = my - zoomRatio * (my - (cy + st.targetPanY)) - cy;
      }

      st.targetZoom = newZoom;
    },
    [trackedBody],
  );

  const handleDoubleClick = useCallback(
    (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = getBodyAtPoint(x, y);
      if (hit) onTrackBody(hit);
    },
    [getBodyAtPoint, onTrackBody],
  );

  const handleMouseLeave = useCallback(() => {
    onHoverBody(null);
    const st = stateRef.current;
    st.dragging = false;
    st.userDragging = false;
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
        onDoubleClick={handleDoubleClick}
      />
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
        Scroll to zoom · Drag to pan · Click to select · Double-click to track
      </div>
    </div>
  );
}

// Deterministic star field
let cachedStars = null;
function getStarField(w, h) {
  if (cachedStars && cachedStars.length > 0) return cachedStars;
  const stars = [];
  const rng = mulberry32(12345);
  for (let i = 0; i < 300; i++) {
    stars.push([
      rng() * 2000,
      rng() * 1200,
      rng() * 1.2 + 0.3,
      rng() * 0.6 + 0.2,
    ]);
  }
  cachedStars = stars;
  return stars;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lighten(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, r + amount);
  const lg = Math.min(255, g + amount);
  const lb = Math.min(255, b + amount);
  return `rgb(${lr},${lg},${lb})`;
}
