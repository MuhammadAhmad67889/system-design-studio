'use client';

/*
 * DiagramCanvas renders one simulation step as an SVG diagram.
 *
 * Nodes are fixed-size boxes (116x58) placed on a 720x360 viewBox.
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

const NODE_WIDTH = 116;
const NODE_HEIGHT = 58;
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

const STATUS_LABEL: Record<NodeStatus, string> = {
  healthy: 'Healthy',
  busy: 'Busy',
  degraded: 'Degraded',
  failed: 'Failed',
  idle: 'Idle',
};

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
      <svg
        ref={svgRef}
        viewBox="0 0 720 360"
        role="img"
        aria-label={diagram.caption}
        className="block h-auto w-full rounded-lg border border-line bg-raised"
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
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#242323" />
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
          const midX = (start.x + end.x) / 2;
          const midY = (start.y + end.y) / 2;
          return (
            <g key={edgeId(edge)}>
              <line
                x1={start.x}
                y1={start.y}
                x2={end.x}
                y2={end.y}
                stroke="#242323"
                strokeWidth={isActive ? 2 : 1.5}
                markerEnd="url(#sim-arrow)"
                className={isActive ? 'sim-flow-line' : undefined}
              />
              {edge.label ? (
                <text
                  x={midX}
                  y={midY - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#756F65"
                >
                  {edge.label}
                </text>
              ) : null}
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
                stroke="#242323"
                strokeWidth={isActive ? 3 : 1.5}
              />
              <g transform={`translate(${node.x + 10} ${node.y + 9})`}>
                <Icon size={18} color="#242323" aria-hidden="true" />
              </g>
              <text x={node.x + 34} y={node.y + 23} fontSize="12" fontWeight="700" fill="#242323">
                {node.label}
              </text>
              {node.sublabel ? (
                <text
                  x={node.x + 10}
                  y={node.y + 38}
                  fontSize="10"
                  fill="#242323"
                  opacity="0.75"
                  textLength={NODE_WIDTH - 20}
                  lengthAdjust="spacingAndGlyphs"
                >
                  {node.sublabel}
                </text>
              ) : null}
              <circle
                cx={node.x + 12}
                cy={node.y + 48}
                r="4"
                fill={STATUS_FILL[status]}
                stroke="#242323"
                strokeWidth="1"
              />
              {showStatusText ? (
                <text x={node.x + 21} y={node.y + 51} fontSize="9" fontWeight="700" fill="#242323">
                  {STATUS_LABEL[status]}
                </text>
              ) : null}
              {node.note ? (
                <text x={node.x + 106} y={node.y + 51} fontSize="9" textAnchor="end" fill="#242323" opacity="0.75">
                  {node.note}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 text-sm text-muted">{diagram.caption}</figcaption>
    </figure>
  );
}
