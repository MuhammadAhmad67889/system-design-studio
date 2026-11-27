'use client';

/*
 * Design Lab: drag components onto a canvas, connect them, edit their
 * details, save the design to the browser, and run a small traffic
 * simulation over it.
 *
 * State lives here: the flow (nodes and edges), undo/redo history,
 * saved projects, and the simulation. The canvas, palette and
 * properties panel are presentational and call back into this page.
 *
 * One deliberate omission: SVG export. React Flow draws nodes as HTML
 * divs and only edges as SVG, so serializing the pane's SVG layer
 * would export the arrows without the boxes — an incomplete file.
 * Export is left out rather than shipped broken.
 */

import { useCallback, useRef, useState } from 'react';
import {
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChangeset,
  type NodeChangeset,
} from '@xyflow/react';
import {
  FilePlus,
  FolderOpen,
  Maximize2,
  Pause,
  Play,
  Redo,
  Save,
  Trash,
  Undo,
} from 'lucide-react';
import type { DesignProject, LabNodeData, NodeStatus } from '@/lib/types';
import LabCanvas, { DEFAULT_EDGE_OPTIONS, type LabFlowEdge, type LabFlowNode } from '@/components/lab/LabCanvas';
import LabPalette, { type PaletteItem } from '@/components/lab/LabPalette';
import LabProperties from '@/components/lab/LabProperties';

const STORAGE_KEY = 'sds-lab-projects';
const HISTORY_LIMIT = 50;

/** A small starter design so the canvas is never an empty grid. */
function starterNodes(): LabFlowNode[] {
  const base = (id: string, label: string, kind: LabNodeData['kind'], x: number, y: number, description: string, capacity: string): LabFlowNode => ({
    id,
    type: 'lab',
    position: { x, y },
    data: { label, kind, description, capacity, status: 'healthy' },
  });
  return [
    base('node-users', 'Users', 'client', 40, 160, 'People using the product from their browsers.', '10k concurrent'),
    base('node-lb', 'Load Balancer', 'lb', 280, 160, 'Spreads incoming requests across healthy servers.', '50k req / sec'),
    base('node-app', 'App Server', 'server', 520, 160, 'Runs the application logic and talks to storage.', '4 vCPU · 8 GB RAM'),
    base('node-db', 'SQL Database', 'db', 780, 70, 'Relational store for structured data that must stay consistent.', '500 GB · primary + replica'),
    base('node-cache', 'Cache / Redis', 'cache', 780, 250, 'In-memory store for hot data and session state.', '8 GB · TTL 1 h'),
  ];
}

function starterEdges(): LabFlowEdge[] {
  const edge = (id: string, source: string, target: string, label: string): LabFlowEdge => ({
    id,
    source,
    target,
    label,
    ...DEFAULT_EDGE_OPTIONS,
  });
  return [
    edge('edge-users-lb', 'node-users', 'node-lb', 'HTTPS requests'),
    edge('edge-lb-app', 'node-lb', 'node-app', 'forwards'),
    edge('edge-app-db', 'node-app', 'node-db', 'reads / writes'),
    edge('edge-app-cache', 'node-app', 'node-cache', 'cache reads'),
  ];
}

interface Snapshot {
  nodes: LabFlowNode[];
  edges: LabFlowEdge[];
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
}

type TrafficRate = 'Low' | 'Normal' | 'High';
type Scenario = 'normal' | 'spike' | 'failure';

const RATE_DURATIONS: Record<TrafficRate, number> = {
  Low: 2.4,
  Normal: 1.2,
  High: 0.6,
};

function readSavedProjects(): DesignProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DesignProject[]) : [];
  } catch {
    return [];
  }
}

function projectToFlow(project: DesignProject): { nodes: LabFlowNode[]; edges: LabFlowEdge[] } {
  return {
    nodes: project.nodes.map((node) => ({
      id: node.id,
      type: 'lab' as const,
      position: { x: node.x, y: node.y },
      // Spread into a fresh object: the flow's data type carries an
      // index signature that the stored type does not.
      data: { ...node.data },
    })),
    edges: project.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      ...DEFAULT_EDGE_OPTIONS,
    })),
  };
}

function DesignLabInner() {
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<LabFlowNode>(starterNodes());
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<LabFlowEdge>(starterEdges());
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const [projectId, setProjectId] = useState<string>('starter');
  const [projectName, setProjectName] = useState('Untitled design');
  // Lazy initializer instead of an effect: localStorage is read once,
  // on the client, when this component first renders.
  const [savedProjects, setSavedProjects] = useState<DesignProject[]>(() =>
    typeof window === 'undefined' ? [] : readSavedProjects(),
  );
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const [playing, setPlaying] = useState(false);
  const [trafficRate, setTrafficRate] = useState<TrafficRate>('Normal');
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);

  const fitViewRef = useRef<() => void>(() => {});
  const idCounter = useRef(100);
  const logCounter = useRef(0);
  const dragSnapshot = useRef<Snapshot | null>(null);
  const scenarioNodeIds = useRef<string[]>([]);

  const logEvent = useCallback((message: string) => {
    const entry: LogEntry = {
      id: ++logCounter.current,
      time: new Date().toLocaleTimeString(),
      message,
    };
    setEventLog((log) => [entry, ...log].slice(0, 30));
  }, []);

  // Push the current flow onto the undo stack before a discrete change.
  const pushHistory = useCallback(() => {
    setPast((previous) => [...previous.slice(-(HISTORY_LIMIT - 1)), { nodes, edges }]);
    setFuture([]);
  }, [nodes, edges]);

  function undo() {
    const previous = past[past.length - 1];
    if (!previous) return;
    setFuture((next) => [{ nodes, edges }, ...next]);
    setPast(past.slice(0, -1));
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }

  function redo() {
    const next = future[0];
    if (!next) return;
    setPast((previous) => [...previous, { nodes, edges }]);
    setFuture(future.slice(1));
    setNodes(next.nodes);
    setEdges(next.edges);
  }

  const onNodesChange = useCallback(
    (changes: NodeChangeset<LabFlowNode>) => {
      // Deletions (Backspace key or the panel button) are discrete
      // changes, so they go on the undo stack. Drags and selections
      // do not: a drag commits once, when it ends.
      if (changes.getByType('remove').length > 0) {
        pushHistory();
      }
      onNodesChangeRaw(changes);
    },
    [onNodesChangeRaw, pushHistory],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChangeset<LabFlowEdge>) => {
      if (changes.getByType('remove').length > 0) {
        pushHistory();
      }
      onEdgesChangeRaw(changes);
    },
    [onEdgesChangeRaw, pushHistory],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      pushHistory();
      setEdges((current) =>
        addEdge({ ...connection, label: 'request', ...DEFAULT_EDGE_OPTIONS }, current),
      );
    },
    [pushHistory, setEdges],
  );

  function addNode(item: PaletteItem, position?: { x: number; y: number }) {
    pushHistory();
    const id = `node-${++idCounter.current}`;
    const spot = position ?? {
      x: 120 + (nodes.length % 4) * 60,
      y: 120 + Math.floor(nodes.length / 4) * 60,
    };
    const node: LabFlowNode = {
      id,
      type: 'lab',
      position: spot,
      data: {
        label: item.label,
        kind: item.kind,
        description: item.description,
        capacity: item.capacity,
        status: 'healthy',
      },
    };
    setNodes((current) => [...current, node]);
    setSelectedNodeId(id);
    setSelectedEdgeId(null);
  }

  function updateNode(id: string, patch: Partial<LabNodeData>) {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node,
      ),
    );
  }

  function deleteNode(id: string) {
    pushHistory();
    setNodes((current) => current.filter((node) => node.id !== id));
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id));
    setSelectedNodeId(null);
  }

  function updateEdge(id: string, label: string) {
    setEdges((current) =>
      current.map((edge) => (edge.id === id ? { ...edge, label } : edge)),
    );
  }

  function deleteEdge(id: string) {
    pushHistory();
    setEdges((current) => current.filter((edge) => edge.id !== id));
    setSelectedEdgeId(null);
  }

  function handleNew() {
    pushHistory();
    setNodes([]);
    setEdges([]);
    setProjectId(`project-${Date.now()}`);
    setProjectName('Untitled design');
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setSaveMessage('');
  }

  function handleClear() {
    pushHistory();
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  function handleSave() {
    const name = projectName.trim() || 'Untitled design';
    const project: DesignProject = {
      id: projectId,
      name,
      updatedAt: new Date().toISOString(),
      nodes: nodes.map((node) => ({
        id: node.id,
        kind: node.data.kind,
        label: node.data.label,
        x: node.position.x,
        y: node.position.y,
        data: node.data,
      })),
      edges: edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        label: typeof edge.label === 'string' ? edge.label : undefined,
      })),
    };
    const saved = readSavedProjects();
    const index = saved.findIndex((item) => item.id === project.id);
    if (index >= 0) {
      saved[index] = project;
    } else {
      saved.push(project);
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    setSavedProjects(saved);
    setProjectName(name);
    setSaveMessage(`Saved “${name}” to this browser.`);
  }

  function handleLoad(project: DesignProject) {
    pushHistory();
    const flow = projectToFlow(project);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setProjectId(project.id);
    setProjectName(project.name);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setShowLoadPanel(false);
    setSaveMessage(`Loaded “${project.name}”.`);
  }

  function handleDeleteSaved(id: string) {
    const saved = readSavedProjects().filter((project) => project.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    setSavedProjects(saved);
  }

  function restoreScenarioNodes() {
    if (scenarioNodeIds.current.length === 0) return;
    const ids = scenarioNodeIds.current;
    scenarioNodeIds.current = [];
    setNodes((current) =>
      current.map((node) =>
        ids.includes(node.id) ? { ...node, data: { ...node.data, status: 'healthy' } } : node,
      ),
    );
  }

  function setNodeStatus(id: string, status: NodeStatus) {
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, status } } : node,
      ),
    );
  }

  function handleScenario(next: Scenario) {
    // Undo whatever the previous scenario did to node statuses first.
    restoreScenarioNodes();
    setScenario(next);

    if (next === 'normal') {
      logEvent('Traffic back to normal.');
      return;
    }

    if (next === 'spike') {
      const target = nodes.find((node) => node.data.kind === 'server' || node.data.kind === 'service');
      if (target) {
        scenarioNodeIds.current = [target.id];
        setNodeStatus(target.id, 'busy');
        logEvent(`Traffic spike: request rate 10× normal — ${target.data.label} is busy.`);
      } else {
        logEvent('Traffic spike: request rate 10× normal.');
      }
      return;
    }

    // Node failure: take down the first server on the canvas.
    const target =
      nodes.find((node) => node.data.kind === 'server') ??
      nodes.find((node) => node.data.kind === 'service');
    if (!target) {
      logEvent('Node failure requested, but there is no server node on the canvas to fail.');
      return;
    }
    scenarioNodeIds.current = [target.id];
    setNodeStatus(target.id, 'failed');
    logEvent(`Node failure: ${target.data.label} is down — traffic is rerouting.`);
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  const toolbarButton =
    'inline-flex items-center gap-1.5 rounded-md border-2 border-line bg-surface px-3 py-1.5 font-display text-sm font-bold hover:border-ink disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-ink">
      {/* Top toolbar */}
      <header className="border-b-2 border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
            <span className="sr-only">Project name</span>
            <input
              type="text"
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              aria-label="Project name"
              className="w-full min-w-0 rounded-md border-2 border-line bg-bg px-2.5 py-1.5 font-display text-sm font-bold sm:w-56"
            />
          </label>
          <button type="button" onClick={handleSave} className={toolbarButton}>
            <Save className="h-4 w-4" aria-hidden /> Save
          </button>
          <button
            type="button"
            onClick={() => setShowLoadPanel((value) => !value)}
            aria-expanded={showLoadPanel}
            className={toolbarButton}
          >
            <FolderOpen className="h-4 w-4" aria-hidden /> Load
          </button>
          <button type="button" onClick={handleNew} className={toolbarButton}>
            <FilePlus className="h-4 w-4" aria-hidden /> New
          </button>
          <button type="button" onClick={handleClear} className={toolbarButton}>
            <Trash className="h-4 w-4" aria-hidden /> Clear
          </button>
          <button type="button" onClick={undo} disabled={past.length === 0} className={toolbarButton}>
            <Undo className="h-4 w-4" aria-hidden /> Undo
          </button>
          <button type="button" onClick={redo} disabled={future.length === 0} className={toolbarButton}>
            <Redo className="h-4 w-4" aria-hidden /> Redo
          </button>
          <button type="button" onClick={() => fitViewRef.current()} className={toolbarButton}>
            <Maximize2 className="h-4 w-4" aria-hidden /> Fit view
          </button>
        </div>
        {saveMessage && (
          <p className="mt-2 text-sm text-muted" role="status">
            {saveMessage}
          </p>
        )}
        {showLoadPanel && (
          <div className="mt-3 rounded-lg border-2 border-line bg-bg p-3">
            <h2 className="font-display text-sm font-bold">Saved projects</h2>
            {savedProjects.length === 0 ? (
              <p className="mt-1 text-sm text-muted">
                Nothing saved yet. Save this design and it will appear here.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {savedProjects.map((project) => (
                  <li key={project.id} className="flex flex-wrap items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() => handleLoad(project)}
                      className="font-bold underline"
                    >
                      {project.name}
                    </button>
                    <span className="text-muted">
                      {project.nodes.length} nodes ·{' '}
                      {new Date(project.updatedAt).toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSaved(project.id)}
                      aria-label={`Delete saved project ${project.name}`}
                      className="inline-flex items-center gap-1 rounded border border-line px-2 py-0.5 text-xs font-bold"
                    >
                      <Trash className="h-3.5 w-3.5" aria-hidden /> Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </header>

      {/* Palette, canvas, properties */}
      <div className="flex flex-1 flex-col lg:min-h-0 lg:flex-row">
        <LabPalette onAddNode={(item) => addNode(item)} />

        <div
          className={`lab-flow relative h-[480px] min-h-[420px] flex-1 lg:h-auto ${
            playing ? '' : 'sim-paused'
          }`}
        >
          {/* Traffic rate drives how fast the edge dashes travel. */}
          <style>{`.lab-flow .sim-flow-line { animation-duration: ${RATE_DURATIONS[trafficRate]}s; }`}</style>
          <LabCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onAddNode={(item, position) => addNode(item, position)}
            onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
              setSelectedNodeId(selectedNodes[0]?.id ?? null);
              setSelectedEdgeId(selectedEdges[0]?.id ?? null);
            }}
            onNodeDragStart={() => {
              dragSnapshot.current = { nodes, edges };
            }}
            onNodeDragStop={() => {
              if (dragSnapshot.current) {
                setPast((previous) => [
                  ...previous.slice(-(HISTORY_LIMIT - 1)),
                  dragSnapshot.current as Snapshot,
                ]);
                setFuture([]);
                dragSnapshot.current = null;
              }
            }}
            fitViewRef={fitViewRef}
          />
        </div>

        <LabProperties
          selectedNode={selectedNode}
          selectedEdge={selectedEdge}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onUpdateEdge={updateEdge}
          onDeleteEdge={deleteEdge}
        />
      </div>

      {/* Bottom simulation bar */}
      <footer className="border-t-2 border-line bg-surface px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !playing;
              setPlaying(next);
              logEvent(next ? 'Traffic started.' : 'Traffic paused.');
            }}
            className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-3 py-1.5 font-display text-sm font-bold shadow-offset"
          >
            {playing ? (
              <>
                <Pause className="h-4 w-4" aria-hidden /> Pause traffic
              </>
            ) : (
              <>
                <Play className="h-4 w-4" aria-hidden /> Play traffic
              </>
            )}
          </button>

          <label className="inline-flex items-center gap-2 text-sm">
            <span className="font-display text-xs font-bold">Traffic rate</span>
            <select
              value={trafficRate}
              onChange={(event) => setTrafficRate(event.target.value as TrafficRate)}
              className="rounded-md border-2 border-line bg-bg px-2 py-1.5 text-sm"
            >
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-2 text-sm">
            <span className="font-display text-xs font-bold">Scenario</span>
            <select
              value={scenario}
              onChange={(event) => handleScenario(event.target.value as Scenario)}
              className="rounded-md border-2 border-line bg-bg px-2 py-1.5 text-sm"
            >
              <option value="normal">Normal</option>
              <option value="spike">Traffic spike</option>
              <option value="failure">Node failure</option>
            </select>
          </label>
        </div>

        <div className="mt-3">
          <h2 className="font-display text-xs font-bold uppercase tracking-wide text-muted">
            Event log
          </h2>
          {eventLog.length === 0 ? (
            <p className="mt-1 text-sm text-muted">
              Press Play traffic or pick a scenario — events will appear here.
            </p>
          ) : (
            <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-sm" aria-live="polite">
              {eventLog.map((entry) => (
                <li key={entry.id} className="flex gap-2">
                  <span className="shrink-0 font-mono text-xs text-muted">{entry.time}</span>
                  <span>{entry.message}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function DesignLabPage() {
  return (
    <ReactFlowProvider>
      <DesignLabInner />
    </ReactFlowProvider>
  );
}
