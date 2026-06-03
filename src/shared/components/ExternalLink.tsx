import { JSX, type ReactNode } from "react";

export const ARROW_SVG = (
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
);

export function ExternalLink({
  href,
  badge,
  label,
}: {
  href: string | undefined;
  badge: ReactNode;
  label: string;
}): JSX.Element {
  if (href) {
    return (
      <a
        className="ext-link ext-link-active"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {badge}
        <span className="ext-link-label">{label}</span>
        {ARROW_SVG}
      </a>
    );
  }
  return (
    <span className="ext-link ext-link-none">
      {badge}
      <span className="ext-link-label">Not available</span>
    </span>
  );
}

export function PanelLinks({
  nasaUrl,
  wikipediaUrl,
}: {
  nasaUrl?: string;
  wikipediaUrl?: string;
}): JSX.Element {
  if (!nasaUrl && !wikipediaUrl) {
    return (
      <div className="links-unavailable">No publicly available information</div>
    );
  }
  return (
    <div className="links-list">
      <ExternalLink
        href={nasaUrl}
        badge={<span className="ext-badge nasa-badge">NASA</span>}
        label="NASA"
      />
      <ExternalLink
        href={wikipediaUrl}
        badge={<span className="ext-badge wiki-badge">W</span>}
        label="Wikipedia"
      />
    </div>
  );
}
