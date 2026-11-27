'use client';

/*
 * Design Lab canvas: the React Flow surface.
 *
 * Nodes and edges live in the page (it owns save, undo and the
 * properties panel); this component only renders the flow and turns
 * palette drags and connections into calls back to the page.
 * The custom node shows its category tint, an icon, its label and a
 * status dot with a text label — status is never shown by color alone.
 */

import { useCallback, type DragEvent, type MutableRefObject } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
  type OnSelectionChangeFunc,
} from '@xyflow/react';
import '@xyflow/react/style.css';
import type { LabNodeData, NodeStatus } from '@/lib/types';
import { findPaletteItem, lookUpNode, type PaletteItem } from './LabPalette';

export type LabFlowNodeData = LabNodeData & { [key: string]: unknown };
export type LabFlowNode = Node<LabFlowNodeData, 'lab'>;
export type LabFlowEdge = Edge;

const STATUS_LABELS: Record<NodeStatus, string> = {
  healthy: 'Healthy',
  busy: 'Busy',
  degraded: 'Degraded',
  failed: 'Failed',
  idle: 'Idle',
};

const STATUS_DOTS: Record<NodeStatus, string> = {
  healthy: 'bg-healthy',
  busy: 'bg-amber',
  degraded: 'bg-amber',
  failed: 'bg-danger',
  idle: 'bg-muted',
};

function LabNodeComponent({ data, selected }: NodeProps<LabFlowNode>) {
  const look = lookUpNode(data.label, data.kind);
  const Icon = look.icon;
  const status: NodeStatus = data.status ?? 'healthy';

  return (
    <div
      className={`w-[180px] rounded-lg border-2 px-3 py-2.5 ${look.tint} ${
        selected ? 'border-ink shadow-offset' : 'border-ink/60'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-ink" />
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 truncate text-sm font-bold">{data.label}</p>
      </div>
      <p className="mt-1.5 flex items-center gap-1.5 text-xs">
        <span
          className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full border border-ink/50 ${STATUS_DOTS[status]}`}
          aria-hidden
        />
        <span className="font-display font-bold">{STATUS_LABELS[status]}</span>
        <span className="truncate text-muted">· {look.category}</span>
      </p>
      <Handle type="source" position={Position.Bottom} className="!bg-ink" />
    </div>
  );
}

// Defined at module level so React Flow does not remount nodes on
// every render (nodeTypes must keep a stable identity).
const nodeTypes: NodeTypes = { lab: LabNodeComponent };

export const DEFAULT_EDGE_OPTIONS: Partial<LabFlowEdge> = {
  markerEnd: { type: MarkerType.ArrowClosed },
  className: 'sim-flow-line',
};

const MINIMAP_COLORS: Record<string, string> = {
  'bg-sky': '#c8dcef',
  'bg-leaf': '#d0e5b6',
  'bg-amber': '#ebaf49',
  'bg-lilac': '#dccef2',
  'bg-surface': '#fcf9f1',
};

interface LabCanvasProps {
  nodes: LabFlowNode[];
  edges: LabFlowEdge[];
  onNodesChange: OnNodesChange<LabFlowNode>;
  onEdgesChange: OnEdgesChange<LabFlowEdge>;
  onConnect: OnConnect;
  onAddNode: (item: PaletteItem, position: { x: number; y: number }) => void;
  onSelectionChange: OnSelectionChangeFunc;
  onNodeDragStart: () => void;
  onNodeDragStop: () => void;
  fitViewRef: MutableRefObject<() => void>;
}

export default function LabCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onAddNode,
  onSelectionChange,
  onNodeDragStart,
  onNodeDragStop,
  fitViewRef,
}: LabCanvasProps) {
  const { screenToFlowPosition } = useReactFlow();

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();
      const itemId = event.dataTransfer.getData('application/reactflow');
      const item = findPaletteItem(itemId);
      if (!item) return;
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      onAddNode(item, position);
    },
    [onAddNode, screenToFlowPosition],
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onSelectionChange={onSelectionChange}
      onNodeDragStart={onNodeDragStart}
      onNodeDragStop={onNodeDragStop}
      onInit={(instance) => {
        fitViewRef.current = () => {
          void instance.fitView({ padding: 0.2 });
        };
      }}
      // React Flow v13 has no colorMode prop: its stylesheet follows
      // the `.dark` class on <html>, which the theme provider sets.
      fitView
      snapToGrid
      snapGrid={[16, 16]}
      deleteKeyCode="Backspace"
      minZoom={0.4}
      maxZoom={2}
      aria-label="Design Lab canvas"
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <Controls />
      <MiniMap
        pannable
        zoomable
        nodeColor={(node) => {
          const data = node.data as LabFlowNodeData | undefined;
          const look = data ? lookUpNode(data.label, data.kind) : undefined;
          return MINIMAP_COLORS[look?.tint ?? 'bg-surface'] ?? '#fcf9f1';
        }}
      />
    </ReactFlow>
  );
}
