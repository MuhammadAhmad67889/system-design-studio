'use client';

/*
 * Design Lab properties panel: edit whatever is selected on the canvas.
 * A node shows its label, description, capacity and status; an edge
 * shows its label. Nothing is shown here that the canvas does not show.
 */

import { ArrowRight, Trash } from 'lucide-react';
import type { LabNodeData, NodeStatus } from '@/lib/types';
import { lookUpNode } from './LabPalette';
import type { LabFlowEdge, LabFlowNode } from './LabCanvas';

const STATUSES: NodeStatus[] = ['healthy', 'busy', 'degraded', 'failed', 'idle'];

const STATUS_LABELS: Record<NodeStatus, string> = {
  healthy: 'Healthy',
  busy: 'Busy',
  degraded: 'Degraded',
  failed: 'Failed',
  idle: 'Idle',
};

interface LabPropertiesProps {
  selectedNode: LabFlowNode | null;
  selectedEdge: LabFlowEdge | null;
  onUpdateNode: (id: string, patch: Partial<LabNodeData>) => void;
  onDeleteNode: (id: string) => void;
  onUpdateEdge: (id: string, label: string) => void;
  onDeleteEdge: (id: string) => void;
}

export default function LabProperties({
  selectedNode,
  selectedEdge,
  onUpdateNode,
  onDeleteNode,
  onUpdateEdge,
  onDeleteEdge,
}: LabPropertiesProps) {
  if (selectedNode) {
    const look = lookUpNode(selectedNode.data.label, selectedNode.data.kind);
    const Icon = look.icon;
    return (
      <aside className="border-t-2 border-line bg-surface p-4 lg:w-[280px] lg:shrink-0 lg:border-l-2 lg:border-t-0">
        <h2 className="font-display text-sm font-bold">Node properties</h2>

        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-md border-2 border-ink p-1.5 ${look.tint}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-bold">{selectedNode.data.label}</p>
            <p className="text-xs text-muted">
              {look.category} · {selectedNode.data.kind}
            </p>
          </div>
        </div>

        <label className="mt-4 block">
          <span className="font-display text-xs font-bold">Label</span>
          <input
            type="text"
            value={selectedNode.data.label}
            onChange={(event) => onUpdateNode(selectedNode.id, { label: event.target.value })}
            className="mt-1 w-full rounded-md border-2 border-line bg-bg px-2.5 py-1.5 text-sm"
          />
        </label>

        <label className="mt-3 block">
          <span className="font-display text-xs font-bold">Description</span>
          <textarea
            rows={3}
            value={selectedNode.data.description ?? ''}
            onChange={(event) =>
              onUpdateNode(selectedNode.id, { description: event.target.value })
            }
            className="mt-1 w-full rounded-md border-2 border-line bg-bg px-2.5 py-1.5 text-sm"
          />
        </label>

        <label className="mt-3 block">
          <span className="font-display text-xs font-bold">Capacity</span>
          <input
            type="text"
            value={selectedNode.data.capacity ?? ''}
            onChange={(event) => onUpdateNode(selectedNode.id, { capacity: event.target.value })}
            className="mt-1 w-full rounded-md border-2 border-line bg-bg px-2.5 py-1.5 text-sm"
          />
        </label>

        <label className="mt-3 block">
          <span className="font-display text-xs font-bold">Status</span>
          <select
            value={selectedNode.data.status ?? 'healthy'}
            onChange={(event) =>
              onUpdateNode(selectedNode.id, { status: event.target.value as NodeStatus })
            }
            className="mt-1 w-full rounded-md border-2 border-line bg-bg px-2.5 py-1.5 text-sm"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => onDeleteNode(selectedNode.id)}
          className="mt-5 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-danger px-3 py-1.5 font-display text-sm font-bold text-white shadow-offset"
        >
          <Trash className="h-4 w-4" aria-hidden />
          Delete node
        </button>
      </aside>
    );
  }

  if (selectedEdge) {
    const label = typeof selectedEdge.label === 'string' ? selectedEdge.label : '';
    return (
      <aside className="border-t-2 border-line bg-surface p-4 lg:w-[280px] lg:shrink-0 lg:border-l-2 lg:border-t-0">
        <h2 className="font-display text-sm font-bold">Edge properties</h2>
        <p className="mt-3 flex flex-wrap items-center gap-1.5 text-sm">
          <span className="font-bold">{selectedEdge.source}</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
          <span className="font-bold">{selectedEdge.target}</span>
        </p>
        <p className="mt-1 text-xs text-muted">
          Connects two nodes. Edit the label to say what flows across it.
        </p>

        <label className="mt-4 block">
          <span className="font-display text-xs font-bold">Label</span>
          <input
            type="text"
            value={label}
            onChange={(event) => onUpdateEdge(selectedEdge.id, event.target.value)}
            placeholder="e.g. HTTP requests"
            className="mt-1 w-full rounded-md border-2 border-line bg-bg px-2.5 py-1.5 text-sm"
          />
        </label>

        <button
          type="button"
          onClick={() => onDeleteEdge(selectedEdge.id)}
          className="mt-5 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-danger px-3 py-1.5 font-display text-sm font-bold text-white shadow-offset"
        >
          <Trash className="h-4 w-4" aria-hidden />
          Delete edge
        </button>
      </aside>
    );
  }

  return (
    <aside className="border-t-2 border-line bg-surface p-4 lg:w-[280px] lg:shrink-0 lg:border-l-2 lg:border-t-0">
      <h2 className="font-display text-sm font-bold">Properties</h2>
      <p className="mt-2 text-sm text-muted">
        Select a node or an edge on the canvas to see and edit its details
        here. Drag components from the palette to add them.
      </p>
    </aside>
  );
}
