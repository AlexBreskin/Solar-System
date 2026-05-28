import { useStarSystem } from "@/shared/contexts/StarSystemContext";
import { BodyType, ROOT_BODY_TYPES } from "@/types";
import type { InfoPanelProps, StatRowProps } from "@/types";
import { auToKm, formatAU, formatKm, formatLY, lyToAU } from "@/utils/distance";
import "./InfoPanel.css";

const TYPE_LABELS: Record<BodyType, string> = {
  [BodyType.Star]: "Star",
  [BodyType.Planet]: "Planet",
  [BodyType.DwarfPlanet]: "Dwarf Planet",
  [BodyType.Moon]: "Moon",
  [BodyType.Asteroid]: "Asteroid",
  [BodyType.Belt]: "Region",
  [BodyType.Companion]: "Companion Star",
  [BodyType.BlackHole]: "Black Hole",
  [BodyType.NeutronStar]: "Neutron Star",
  [BodyType.Quasar]: "Quasar",
};

function StatRow({ label, value, title }: StatRowProps): JSX.Element | null {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="stat-row">
      <span className="stat-label">{label}</span>
      <span className="stat-value" title={title}>
        {value}
      </span>
    </div>
  );
}

function formatPeriod(days: number): string {
  if (!days) return "—";
  const absDays = Math.abs(days);
  const retro = days < 0 ? " (retrograde)" : "";
  if (absDays < 1 / 86_400_000)
    return `${(absDays * 86_400_000).toFixed(1)} ms${retro}`;
  if (absDays < 1) return `${(absDays * 24).toFixed(1)} hours${retro}`;
  if (absDays < 365) return `${absDays.toFixed(2)} days${retro}`;
  const years = absDays / 365.25;
  if (years < 100) return `${years.toFixed(2)} years${retro}`;
  return `${Math.round(years).toLocaleString()} years${retro}`;
}

function formatDiameter(km: number): string {
  if (!km) return "—";
  if (km < 100) return `${km.toFixed(1)} km`;
  return `${km.toLocaleString()} km`;
}

export default function InfoPanel({
  selectedBody,
}: InfoPanelProps): JSX.Element {
  const { bodies, meta } = useStarSystem();
  const body = bodies[selectedBody];
  if (!body) return <div className="info-panel empty">Select a body</div>;

  const isRetrograde = body.rotationPeriod < 0;
  const bodyType = body.type as BodyType;

  return (
    <div className="info-panel">
      <div className="info-header">
        <div className="info-dot-wrap">
          <div
            className="info-dot"
            style={{
              background: body.color,
              boxShadow: `0 0 16px ${body.glowColor ?? body.color}80`,
            }}
          />
          {body.type === BodyType.Star && (
            <div className="sun-pulse" style={{ borderColor: body.color }} />
          )}
        </div>
        <div className="info-title-block">
          <div className="info-name">{body.name}</div>
          <div className="info-type">{TYPE_LABELS[bodyType]}</div>
        </div>
      </div>

      {body.parent && (
        <div className="info-parent">
          Orbiting <span>{bodies[body.parent]?.name ?? body.parent}</span>
        </div>
      )}

      <p className="info-description">{body.description}</p>

      <div className="info-section">
        <div className="info-section-title">Physical</div>
        <StatRow label="Diameter" value={formatDiameter(body.diameter)} />
        <StatRow label="Mass" value={body.mass} />
        <StatRow label="Temperature" value={body.surfaceTemp} />
        {body.moons > 0 && <StatRow label="Known Moons" value={body.moons} />}
      </div>

      <div className="info-section">
        <div className="info-section-title">Orbital</div>
        <StatRow
          label="Distance"
          value={formatAU(body.distanceFromParent)}
          title={
            body.distanceFromParent
              ? formatKm(auToKm(body.distanceFromParent))
              : undefined
          }
        />
        <StatRow
          label="Orbital Period"
          value={formatPeriod(body.orbitalPeriod)}
        />
        <StatRow
          label="Rotation Period"
          value={formatPeriod(body.rotationPeriod)}
        />
        <StatRow label="Eccentricity" value={body.eccentricity?.toFixed(3)} />
        <StatRow
          label="Inclination"
          value={body.inclination != null ? `${body.inclination}°` : null}
        />
        {isRetrograde && (
          <div className="retrograde-tag">⟲ Retrograde rotation</div>
        )}
      </div>

      {ROOT_BODY_TYPES.has(body.type) && meta.distanceFromEarth != null && (
        <div className="info-section">
          <div className="info-section-title">Location</div>
          <StatRow
            label="Distance from Earth"
            value={formatLY(meta.distanceFromEarth)}
            title={formatAU(lyToAU(meta.distanceFromEarth))}
          />
        </div>
      )}

      {body.atmosphere && (
        <div className="info-section">
          <div className="info-section-title">Atmosphere</div>
          <div className="atmo-text">{body.atmosphere}</div>
        </div>
      )}

      <div className="info-funfact">
        <div className="funfact-label">★ Did you know?</div>
        <div className="funfact-text">{body.funFact}</div>
      </div>

      <div className="info-section">
        <div className="info-section-title">Learn More</div>
        {!body.nasaUrl && !body.wikipediaUrl ? (
          <div className="links-unavailable">
            No publicly available information
          </div>
        ) : (
          <div className="links-list">
            {body.nasaUrl ? (
              <a
                className="ext-link ext-link-active"
                href={body.nasaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ext-badge nasa-badge">NASA</span>
                <span className="ext-link-label">NASA</span>
                <svg
                  className="ext-arrow"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8L8 2M8 2H4M8 2V6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : (
              <span className="ext-link ext-link-none">
                <span className="ext-badge nasa-badge">NASA</span>
                <span className="ext-link-label">Not available</span>
              </span>
            )}
            {body.wikipediaUrl ? (
              <a
                className="ext-link ext-link-active"
                href={body.wikipediaUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="ext-badge wiki-badge">W</span>
                <span className="ext-link-label">Wikipedia</span>
                <svg
                  className="ext-arrow"
                  viewBox="0 0 10 10"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 8L8 2M8 2H4M8 2V6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            ) : (
              <span className="ext-link ext-link-none">
                <span className="ext-badge wiki-badge">W</span>
                <span className="ext-link-label">Not available</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
