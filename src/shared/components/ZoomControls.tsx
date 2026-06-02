import React, { JSX } from "react";
import "./canvas-shared.css";

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export default function ZoomControls({
  onZoomIn,
  onZoomOut,
}: ZoomControlsProps): JSX.Element {
  return (
    <div className="canvas-zoom-controls">
      <button
        className="canvas-zoom-btn"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        className="canvas-zoom-btn"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}
