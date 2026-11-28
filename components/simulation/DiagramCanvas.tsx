'use client';

/*
 * DiagramCanvas renders one simulation step as an SVG diagram.
 *
 * Nodes are fixed-size boxes (150x100) placed on a 720x400 viewBox.
 * Edges run from the boundary of one node to the boundary of the next,
 * so the line never hides under a box. Active edges also carry a
 * particle that travels from the centre of one node to the centre of
 * the other, plus a flowing dash class from globals.css.
 *
 * The caption is rendered as visible text under the canvas: the
 * diagram is never the only place the information lives, so the
 * step is still understandable with motion or images off.
 */

import { useEffect, useRef } from 'react';
import {
  Cloud,
  Cpu,
  Database,
  DoorOpen,
  Globe,
  Inbox,
  Monitor,
  Scale,
  Server,
  User,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import type { DiagramConfig, DiagramEdge, DiagramNode, NodeKind, NodeStatus } from '@/lib/types';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 100;
const HALF_WIDTH = NODE_WIDTH / 2;
const HALF_HEIGHT = NODE_HEIGHT / 2;

/** Fill colour for each node kind, from the design tokens. */
const KIND_FILL: Record<NodeKind, string> = {
  user: '#EBAF49',
  client: '#C8DCEF',
  dns: '#DCCEF2',
  lb: '#EBAF49',
  gateway: '#C8DCEF',
  server: '#C8DCEF',
  db: '#DCCEF2',
  cache: '#D0E5B6',
  queue: '#EBAF49',
  cdn: '#C8DCEF',
  service: '#D0E5B6',
};

const KIND_ICON: Record<NodeKind, LucideIcon> = {
  user: User,
  client: Monitor,
  dns: Globe,
  lb: Scale,
  gateway: DoorOpen,
  server: Server,
  db: Database,
  cache: Zap,
  queue: Inbox,
  cdn: Cloud,
  service: Cpu,
};

/** Status dot colour. Failed and degraded also get a text label. */
const STATUS_FILL: Record<NodeStatus, string> = {
  healthy: '#8DBB83',
  busy: '#EBAF49',
  degraded: '#EBAF49',
  failed: '#C65B4E',
  idle: '#756F65',
};

// Ink, muted and paper come from the theme tokens in globals.css,
// so the lines and labels drawn on the page background follow the
// light/dark theme. In the light theme these are exactly #242323,
// #756F65 and #FCF9F1, so the light look is unchanged; in the dark
// theme they become the light ink, muted and surface colours
// instead of dark-on-dark.
// Node text and icons are the exception: they sit on the fixed
// light pastel fills, so they stay #242323 in both themes.
const INK = 'var(--ink)';
const MUTED = 'var(--muted)';
const PAPER = 'var(--surface)';

const STATUS_LABEL: Record<NodeStatus, string> = {
  healthy: 'Healthy',
  busy: 'Busy',
  degraded: 'Degraded',
  failed: 'Failed',
  idle: 'Idle',
};

// Conservative per-character widths for Inter, as a fraction of the
// font size. The wrap below deliberately overestimates, so a line the
// helper says fits always fits on screen.
const BOLD_CHAR_WIDTH = 0.62;
const REGULAR_CHAR_WIDTH = 0.55;

/**
 * Greedy word wrap, capped at two lines. SVG <text> never wraps on
 * its own, so without this a long label would spill out of its box.
 * A single word wider than the box is split mid-word across lines
 * rather than allowed to stick out.
 */
function wrapText(text: string, fontSize: number, bold: boolean, maxWidth: number): string[] {
  const charWidth = (bold ? BOLD_CHAR_WIDTH : REGULAR_CHAR_WIDTH) * fontSize;
  const maxChars = Math.max(1, Math.floor(maxWidth / charWidth));
  // Break overlong words into fitting chunks first, so every piece
  // the packer sees already fits on one line.
  const pieces = text.split(' ').flatMap((word) => {
    if (word.length <= maxChars) return [word];
    const chunks: string[] = [];
    for (let i = 0; i < word.length; i += maxChars) {
      chunks.push(word.slice(i, i + maxChars));
    }
    return chunks;
  });
  const lines: string[] = [];
  let line = '';
  for (const piece of pieces) {
    const next = line ? `${line} ${piece}` : piece;
    if (next.length <= maxChars) {
      line = next;
    } else {
      if (line) lines.push(line);
      line = piece;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function nodeCenter(node: DiagramNode): { x: number; y: number } {
  return { x: node.x + HALF_WIDTH, y: node.y + HALF_HEIGHT };
}

/**
 * Point where a line leaving `from` towards `to` crosses the edge of
 * the `from` box, so the line starts at the box boundary, not its centre.
 */
function boundaryPoint(from: DiagramNode, to: DiagramNode): { x: number; y: number } {
  const start = nodeCenter(from);
  const end = nodeCenter(to);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const scaleX = dx === 0 ? Infinity : HALF_WIDTH / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : HALF_HEIGHT / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);
  return { x: start.x + dx * scale, y: start.y + dy * scale };
}

function edgeId(edge: DiagramEdge): string {
  return `${edge.from}->${edge.to}`;
}

/**
 * Midpoint of an edge, where its label sits (slightly above the line).
 * Edge labels are painted after the nodes (see below), so a label
 * wider than the gap between two boxes stays readable over the box
 * edges instead of hiding underneath them.
 */
function edgeLabelPosition(from: DiagramNode, to: DiagramNode): { x: number; y: number } {
  const start = boundaryPoint(from, to);
  const end = boundaryPoint(to, from);
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 - 6 };
}

interface DiagramCanvasProps {
  diagram: DiagramConfig;
  playing: boolean;
}

export function DiagramCanvas({ diagram, playing }: DiagramCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // SVG SMIL animation has no CSS play state, so pause it directly
  // when playback stops or the user prefers reduced motion.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const shouldPause = !playing || prefersReducedMotion;
    if (typeof svg.pauseAnimations === 'function' && typeof svg.unpauseAnimations === 'function') {
      if (shouldPause) svg.pauseAnimations();
      else svg.unpauseAnimations();
    }
  }, [playing]);

  const nodesById = new Map(diagram.nodes.map((node) => [node.id, node]));
  const activeNodes = new Set(diagram.activeNodeIds ?? []);
  const activeEdges = new Set(diagram.activeEdgeIds ?? []);

  return (
    <figure className="w-full">
      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox="0 0 720 400"
          role="img"
          aria-label={diagram.caption}
          className="block h-auto w-full min-w-[600px] rounded-lg border border-line bg-raised"
        >
        <defs>
          <marker
            id="sim-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={INK} />
          </marker>
        </defs>

        {diagram.edges.map((edge) => {
          const from = nodesById.get(edge.from);
          const to = nodesById.get(edge.to);
          if (!from || !to) return null;
          const isActive = activeEdges.has(edgeId(edge));
          const start = boundaryPoint(from, to);
          const end = boundaryPoint(to, from);
          const fromCenter = nodeCenter(from);
          const toCenter = nodeCenter(to);
          return (
            <g key={edgeId(edge)}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke={INK}
                strokeWidth={isActive ? 2 : 1.5}
                markerEnd="url(#sim-arrow)"
                className={isActive ? 'sim-flow-line' : undefined}
              />
              {isActive ? (
                <circle r="5" fill="#EBAF49" data-testid="sim-particle">
                  <animateMotion
                    dur="2.4s"
                    repeatCount="indefinite"
                    path={`M ${fromCenter.x} ${fromCenter.y} L ${toCenter.x} ${toCenter.y}`}
                  />
                </circle>
              ) : null}
            </g>
          );
        })}

        {diagram.nodes.map((node) => {
          const isActive = activeNodes.has(node.id);
          const status = node.status ?? 'healthy';
          const Icon = KIND_ICON[node.kind];
          const showStatusText = status === 'failed' || status === 'degraded';
          // Label and sublabel share the area below the icon row
          // (y+30 to y+100) and are centred in it as one block.
          const labelLines = wrapText(node.label, 14, true, NODE_WIDTH - 16);
          const subLines = node.sublabel
            ? wrapText(node.sublabel, 12, false, NODE_WIDTH - 16)
            : [];
          const blockHeight =
            labelLines.length * 17 + (subLines.length ? 4 + subLines.length * 15 : 0);
          const textTop = 30 + (70 - blockHeight) / 2;
          const centerX = node.x + NODE_WIDTH / 2;
          return (
            <g key={node.id}>
              {isActive ? (
                <rect
                  x={node.x - 4}
                  y={node.y - 4}
                  width={NODE_WIDTH + 8}
                  height={NODE_HEIGHT + 8}
                  rx="12"
                  fill="#D0E5B6"
                  opacity="0.5"
                />
              ) : null}
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx="10"
                fill={KIND_FILL[node.kind]}
                stroke={INK}
                strokeWidth={isActive ? 3 : 1.5}
              />
              <g transform={`translate(${node.x + 9} ${node.y + 9})`}>
                <Icon size={16} color="#242323" aria-hidden="true" />
              </g>
              {labelLines.map((line, i) => (
                <text
                  key={`label-${i}`}
                  x={centerX}
                  y={node.y + textTop + 11 + i * 17}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#242323"
                >
                  {line}
                </text>
              ))}
              {subLines.map((line, j) => (
                <text
                  key={`sub-${j}`}
                  x={centerX}
                  y={node.y + textTop + labelLines.length * 17 + 4 + 9 + j * 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#242323"
                  opacity="0.75"
                >
                  {line}
                </text>
              ))}
              <circle
                cx={node.x + 139}
                cy={node.y + 17}
                r="4.5"
                fill={STATUS_FILL[status]}
                stroke="#242323"
                strokeWidth="1"
              />
              {showStatusText ? (
                <text
                  x={node.x + 129}
                  y={node.y + 20}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight="700"
                  fill="#242323"
                >
                  {STATUS_LABEL[status]}
                </text>
              ) : null}
              {node.note ? (
                <text x={node.x + 140} y={node.y + 93} fontSize="9" textAnchor="end" fill="#242323" opacity="0.75">
                  {node.note}
                </text>
              ) : null}
            </g>
          );
        })}

        {/* Edge labels paint last, over the node boxes. A label wider
          than the gap between two boxes would otherwise hide under
          them; on top, the paper halo keeps it readable where it
          crosses a box edge. */}
        {diagram.edges.map((edge) => {
          if (!edge.label) return null;
          const from = nodesById.get(edge.from);
          const to = nodesById.get(edge.to);
          if (!from || !to) return null;
          const { x, y } = edgeLabelPosition(from, to);
          return (
            <text
              key={`label-${edgeId(edge)}`}
              x={x}
              y={y}
              textAnchor="middle"
              fontSize="11"
              fill={MUTED}
              stroke={PAPER}
              strokeWidth="4"
              paintOrder="stroke"
              strokeLinejoin="round"
            >
              {edge.label}
            </text>
          );
        })}
      </svg>
      </div>
      <figcaption className="mt-2 text-sm text-muted">{diagram.caption}</figcaption>
    </figure>
  );
}
