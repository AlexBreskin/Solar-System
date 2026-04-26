import React, { useState } from 'react';
import { CELESTIAL_BODIES, BODY_HIERARCHY } from '../data/celestialBodies';
import type { BodyType, OutlinerProps, OutlinerNodeProps, FlatOutlinerRowProps } from '../types';
import './Outliner.css';

const TYPE_ICONS: Record<BodyType, string> = {
  star: '☀',
  planet: '●',
  'dwarf-planet': '◎',
  moon: '○',
  asteroid: '·',
  belt: '⌀',
};

const TYPE_LABELS: Record<BodyType, string> = {
  star: 'Star',
  planet: 'Planet',
  'dwarf-planet': 'Dwarf Planet',
  moon: 'Moon',
  asteroid: 'Asteroid',
  belt: 'Region',
};

function OutlinerNode({
  node, depth, selectedBody, hoveredBody, onSelectBody, onHoverBody, defaultOpen,
}: OutlinerNodeProps): JSX.Element | null {
  const [open, setOpen] = useState<boolean>(defaultOpen ?? depth < 2);
  const body = CELESTIAL_BODIES[node.id];
  if (!body) return null;

  const hasChildren = node.children.length > 0;
  const isSelected = selectedBody === node.id;
  const isHovered = hoveredBody === node.id;

  return (
    <div className="outliner-node">
      <div
        className={`outliner-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        style={{ paddingLeft: 12 + depth * 16 }}
        onClick={() => onSelectBody(node.id)}
        onMouseEnter={() => onHoverBody(node.id)}
        onMouseLeave={() => onHoverBody(null)}
      >
        {hasChildren ? (
          <button
            className={`expand-btn ${open ? 'open' : ''}`}
            onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            ›
          </button>
        ) : (
          <span className="expand-spacer" />
        )}
        <span className="body-dot" style={{ background: body.color, boxShadow: isSelected ? `0 0 6px ${body.color}` : 'none' }} />
        <span className="body-icon" title={TYPE_LABELS[body.type]}>{TYPE_ICONS[body.type]}</span>
        <span className="body-name">{body.name}</span>
        <span className="body-type-badge">{TYPE_LABELS[body.type]}</span>
        {body.moons > 0 && (
          <span className="moon-count" title={`${body.moons} known moons`}>{body.moons}↑</span>
        )}
      </div>

      {hasChildren && open && (
        <div className="outliner-children">
          {node.children.map(child => (
            <OutlinerNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedBody={selectedBody}
              hoveredBody={hoveredBody}
              onSelectBody={onSelectBody}
              onHoverBody={onHoverBody}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FlatOutlinerRow({
  id, selectedBody, hoveredBody, onSelectBody, onHoverBody, isPlanet,
}: FlatOutlinerRowProps): JSX.Element | null {
  const body = CELESTIAL_BODIES[id];
  if (!body) return null;
  const isSelected = selectedBody === id;
  const isHovered = hoveredBody === id;
  return (
    <div
      className={`outliner-row ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      style={{ paddingLeft: isPlanet ? 12 : 28 }}
      onClick={() => onSelectBody(id)}
      onMouseEnter={() => onHoverBody(id)}
      onMouseLeave={() => onHoverBody(null)}
    >
      <span className="expand-spacer" />
      <span className="body-dot" style={{ background: body.color, boxShadow: isSelected ? `0 0 6px ${body.color}` : 'none' }} />
      <span className="body-icon" title={TYPE_LABELS[body.type]}>{TYPE_ICONS[body.type]}</span>
      <span className="body-name">{body.name}</span>
      <span className="body-type-badge">{TYPE_LABELS[body.type]}</span>
    </div>
  );
}

export default function Outliner({
  selectedBody, hoveredBody, onSelectBody, onHoverBody, filterIds,
}: OutlinerProps): JSX.Element {
  const isPlanetView = filterIds !== null;
  const planetId = isPlanetView ? filterIds![0] : null;
  const moonIds = isPlanetView ? filterIds!.slice(1) : [];

  return (
    <div className="outliner">
      <div className="outliner-header">
        <span className="outliner-title">
          {isPlanetView
            ? (CELESTIAL_BODIES[planetId!]?.name ?? 'Planet') + ' System'
            : 'Celestial Bodies'}
        </span>
        <span className="outliner-count">
          {isPlanetView ? filterIds!.length : Object.keys(CELESTIAL_BODIES).length}
        </span>
      </div>
      <div className="outliner-scroll">
        {isPlanetView ? (
          <>
            <FlatOutlinerRow
              id={planetId!}
              selectedBody={selectedBody}
              hoveredBody={hoveredBody}
              onSelectBody={onSelectBody}
              onHoverBody={onHoverBody}
              isPlanet={true}
            />
            {moonIds.length > 0 && (
              <div className="outliner-section-label">Moons ({moonIds.length})</div>
            )}
            {moonIds.map(id => (
              <FlatOutlinerRow
                key={id}
                id={id}
                selectedBody={selectedBody}
                hoveredBody={hoveredBody}
                onSelectBody={onSelectBody}
                onHoverBody={onHoverBody}
                isPlanet={false}
              />
            ))}
            {moonIds.length === 0 && (
              <div className="outliner-empty">No known moons</div>
            )}
          </>
        ) : (
          BODY_HIERARCHY.map(node => (
            <OutlinerNode
              key={node.id}
              node={node}
              depth={0}
              selectedBody={selectedBody}
              hoveredBody={hoveredBody}
              onSelectBody={onSelectBody}
              onHoverBody={onHoverBody}
              defaultOpen={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
