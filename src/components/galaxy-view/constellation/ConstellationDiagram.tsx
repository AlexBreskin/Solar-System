import { useMemo, useState } from "react";
import { STAR_SYSTEMS } from "@/data/systems";
import type { ConstellationOutline } from "@/types/galaxy";
import { buildProjection } from "@/utils/constellationProjection";

const SYSTEM_COLORS: Record<string, string> = {};
for (const s of STAR_SYSTEMS) SYSTEM_COLORS[s.id] = s.starColor;

function starRadius(mag: number = 3.5): number {
  return Math.max(0.8, 3.5 - mag * 0.4);
}

export function ConstellationDiagram({
  outline,
  onSelectSystem,
  onZoomToSystem,
}: {
  outline: ConstellationOutline;
  onSelectSystem?: (id: string) => void;
  onZoomToSystem?: (id: string) => void;
}): JSX.Element {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const projection = useMemo(
    () => buildProjection(outline.lines, outline.stars),
    [outline],
  );

  const tooltip =
    hoveredIdx !== null
      ? (() => {
          const star = outline.stars[hoveredIdx];
          const { x: sx, y: sy } = projection.project(star.ra, star.dec);
          const r = starRadius(star.mag);
          const { name } = star;
          const tWidth = Math.max(20, name.length * 4.4 + 6);
          const tHeight = 7.5;
          const rawTX = sx - tWidth / 2;
          const tX = Math.max(1, Math.min(rawTX, 99 - tWidth));
          const tY = sy > 75 ? sy - r - tHeight - 2 : sy + r + 2;
          return { tX, tY, tWidth, tHeight, name };
        })()
      : null;

  return (
    <svg
      className="gsp-constellation-diagram"
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect width="100" height="100" rx="4" fill="rgba(0,0,0,0.5)" />
      {outline.lines.map((segment, si) => (
        <polyline
          key={si}
          points={segment
            .map(([ra, dec]) => {
              const { x, y } = projection.project(ra, dec);
              return `${x},${y}`;
            })
            .join(" ")}
          stroke="rgba(200,215,255,0.25)"
          strokeWidth="0.7"
          fill="none"
        />
      ))}
      {outline.stars.map((star, i) => {
        const { x: sx, y: sy } = projection.project(star.ra, star.dec);
        const isSystem = !!star.systemId;
        const color = isSystem
          ? (SYSTEM_COLORS[star.systemId!] ?? "#ffffff")
          : "#c8d8ff";
        const r = starRadius(star.mag);
        return (
          <g
            key={i}
            style={{ cursor: isSystem ? "pointer" : "default" }}
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => isSystem && onSelectSystem?.(star.systemId!)}
            onDoubleClick={() => isSystem && onZoomToSystem?.(star.systemId!)}
          >
            {isSystem && (
              <circle
                cx={sx}
                cy={sy}
                r={r + 3}
                fill="none"
                stroke={color}
                strokeWidth="0.6"
                opacity="0.4"
              />
            )}
            <circle
              cx={sx}
              cy={sy}
              r={r}
              fill={color}
              opacity={isSystem ? 1 : 0.75}
            />
          </g>
        );
      })}
      {tooltip && (
        <g style={{ pointerEvents: "none" }}>
          <rect
            x={tooltip.tX}
            y={tooltip.tY}
            width={tooltip.tWidth}
            height={tooltip.tHeight}
            rx="1.5"
            fill="rgba(8,12,24,0.9)"
          />
          <text
            x={tooltip.tX + tooltip.tWidth / 2}
            y={tooltip.tY + 5.4}
            textAnchor="middle"
            fontSize="4.5"
            fill="rgba(200,220,255,0.95)"
            fontFamily="Syne,sans-serif"
          >
            {tooltip.name}
          </text>
        </g>
      )}
    </svg>
  );
}
