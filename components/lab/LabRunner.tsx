'use client';

/*
 * Lab runner: one guided lab on the Design Lab canvas.
 *
 * The left column holds the lab itself — the goal, the numbered
 * steps, and the checks. The middle holds the canvas with the same
 * palette, properties panel and traffic simulation as the Design
 * Lab. Step and self-check ticks persist in the progress store;
 * resetting the canvas to the starter template only resets the
 * canvas, never the ticks.
 *
 * Checks are honest by construction: auto checks are evaluated live
 * from the actual canvas, and self-checks are labelled as ticked by
 * the learner, never presented as verified.
 */

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type EdgeChangeset,
  type NodeChangeset,
} from '@xyflow/react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  Lightbulb,
  Maximize2,
  Pause,
  Play,
  Redo,
  RotateCcw,
  Undo,
  X,
} from 'lucide-react';
import type { Lab, LabTemplate, NodeStatus } from '@/lib/types';
import { autoChecks, evaluateLabCheck, passedAutoCheckCount } from '@/lib/labs';
import { getLesson } from '@/lib/content';
import { useProgressStore } from '@/store/progress-store';
import LabCanvas, { DEFAULT_EDGE_OPTIONS, type LabFlowEdge, type LabFlowNode } from '@/components/lab/LabCanvas';
import LabPalette, { PALETTE_GROUPS, type PaletteItem } from '@/components/lab/LabPalette';
import LabProperties from '@/components/lab/LabProperties';
import { Badge, difficultyTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const HISTORY_LIMIT = 50;

type TrafficRate = 'Low' | 'Normal' | 'High';
type Scenario = 'normal' | 'spike' | 'failure';

const RATE_DURATIONS: Record<TrafficRate, number> = {
  Low: 2.4,
  Normal: 1.2,
  High: 0.6,
};

interface Snapshot {
  nodes: LabFlowNode[];
  edges: LabFlowEdge[];
}

interface LogEntry {
  id: number;
  time: string;
  message: string;
}

/** Palette defaults for a template node that carries no description. */
function paletteDefaults(label: string, kind: LabTemplate['nodes'][number]['kind']) {
  for (const group of PALETTE_GROUPS) {
    const found = group.items.find((item) => item.label === label && item.kind === kind);
    if (found) return { description: found.description, capacity: found.capacity };
  }
  return { description: '', capacity: '' };
}

/** Same template-to-flow shape as the Design Lab's projectToFlow. */
function templateToFlow(template: LabTemplate): { nodes: LabFlowNode[]; edges: LabFlowEdge[] } {
  return {
    nodes: template.nodes.map((node) => {
      const defaults = paletteDefaults(node.label, node.kind);
      return {
        id: node.id,
        type: 'lab' as const,
        position: { x: node.x, y: node.y },
        data: {
          label: node.label,
          kind: node.kind,
          description: node.description ?? defaults.description,
          capacity: node.capacity ?? defaults.capacity,
          status: 'healthy' as NodeStatus,
        },
      };
    }),
    edges: template.edges.map((edge) => ({
      id: `edge-${edge.from}-${edge.to}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      ...DEFAULT_EDGE_OPTIONS,
    })),
  };
}

function LabRunnerInner({ lab }: { lab: Lab }) {
  const starter = templateToFlow(lab.starter);
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<LabFlowNode>(starter.nodes);
  const [edges, setEdges, onEdgesChangeRaw] = useEdgesState<LabFlowEdge>(starter.edges);
  const [past, setPast] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [openHints, setOpenHints] = useState<Set<string>>(new Set());

  const [playing, setPlaying] = useState(false);
  const [trafficRate, setTrafficRate] = useState<TrafficRate>('Normal');
  const [scenario, setScenario] = useState<Scenario>('normal');
  const [eventLog, setEventLog] = useState<LogEntry[]>([]);

  const fitViewRef = useRef<() => void>(() => {});
  const idCounter = useRef(100);
  const logCounter = useRef(0);
  const dragSnapshot = useRef<Snapshot | null>(null);
  const scenarioNodeIds = useRef<string[]>([]);

  const entry = useProgressStore((state) => state.labProgress[lab.id]);
  const toggleLabStep = useProgressStore((state) => state.toggleLabStep);
  const toggleLabSelfCheck = useProgressStore((state) => state.toggleLabSelfCheck);
  const completeLab = useProgressStore((state) => state.completeLab);
  const resetLabProgress = useProgressStore((state) => state.resetLabProgress);

  const doneSteps = new Set(entry?.doneSteps ?? []);
  const doneSelfChecks = new Set(entry?.doneSelfChecks ?? []);
  const completed = entry?.completed ?? false;

  const logEvent = useCallback((message: string) => {
    const entryLog: LogEntry = {
      id: ++logCounter.current,
      time: new Date().toLocaleTimeString(),
      message,
    };
    setEventLog((log) => [entryLog, ...log].slice(0, 30));
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

  function updateNode(id: string, patch: Partial<LabFlowNode['data']>) {
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

  /** Reset the canvas to the starter template. Step and check ticks stay. */
  function loadStarter() {
    pushHistory();
    const flow = templateToFlow(lab.starter);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
  }

  function loadSolution() {
    pushHistory();
    const flow = templateToFlow(lab.solution.template);
    setNodes(flow.nodes);
    setEdges(flow.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
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

  function toggleHint(stepId: string) {
    setOpenHints((current) => {
      const next = new Set(current);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId) ?? null;

  // Checks read the live canvas, reduced to what the checker needs.
  const checkNodes = nodes.map((node) => ({
    id: node.id,
    kind: node.data.kind,
    label: node.data.label,
  }));
  const checkEdges = edges.map((edge) => ({ source: edge.source, target: edge.target }));
  const auto = autoChecks(lab);
  const passed = passedAutoCheckCount(lab, checkNodes, checkEdges);
  const allAutoPass = auto.length > 0 && passed === auto.length;
  const relatedLessons = lab.relatedLessons
    .map((lessonId) => getLesson(lessonId))
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined);

  const toolbarButton =
    'inline-flex items-center gap-1.5 rounded-md border-2 border-line bg-surface px-3 py-1.5 font-display text-sm font-bold hover:border-ink disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <Link
        href="/labs"
        className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All labs
      </Link>
      <header className="mt-3">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Lab {lab.number}
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{lab.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={difficultyTone(lab.difficulty)}>{lab.difficulty}</Badge>
          <span className="text-sm text-muted">{lab.estMin} min</span>
          {completed ? (
            <span className="inline-flex items-center gap-1 text-sm font-bold text-healthy">
              <Check className="h-4 w-4" aria-hidden />
              Lab complete
            </span>
          ) : null}
        </div>
      </header>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        {/* Left column: intro, steps, checks, completion */}
        <div className="order-1 space-y-6 lg:w-[320px] lg:shrink-0">
          <Card className="p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              The goal
            </h2>
            <p className="mt-2 text-sm leading-relaxed sm:text-base">{lab.goal}</p>
            <h2 className="mt-4 font-display text-sm font-bold uppercase tracking-wide text-muted">
              Why it matters
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{lab.whyItMatters}</p>
            {relatedLessons.length > 0 ? (
              <>
                <h2 className="mt-4 font-display text-sm font-bold uppercase tracking-wide text-muted">
                  Related lessons
                </h2>
                <ul className="mt-2 space-y-1.5">
                  {relatedLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${lesson.id}`}
                        className="text-sm font-bold text-ink hover:underline"
                      >
                        Lesson {lesson.number}: {lesson.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              Steps
            </h2>
            <ol className="mt-3 space-y-4">
              {lab.steps.map((step, index) => {
                const done = doneSteps.has(step.id);
                const hintOpen = openHints.has(step.id);
                return (
                  <li key={step.id}>
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-xs font-bold ${
                          done
                            ? 'border-healthy bg-leaf text-ink'
                            : 'border-line bg-raised text-muted'
                        }`}
                        aria-hidden
                      >
                        {done ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold leading-snug sm:text-base">
                          {step.title}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-muted">
                          {step.instruction}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleHint(step.id)}
                            aria-expanded={hintOpen}
                            className="inline-flex items-center gap-1 font-display text-xs font-bold text-muted hover:text-ink"
                          >
                            <Lightbulb className="h-4 w-4" aria-hidden />
                            {hintOpen ? 'Hide hint' : 'Show hint'}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${hintOpen ? 'rotate-180' : ''}`}
                              aria-hidden
                            />
                          </button>
                          <label className="inline-flex cursor-pointer items-center gap-1.5 text-sm">
                            <input
                              type="checkbox"
                              checked={done}
                              onChange={() => toggleLabStep(lab.id, step.id)}
                              className="h-4 w-4 accent-healthy"
                            />
                            <span className="font-bold">Done</span>
                          </label>
                        </div>
                        {hintOpen ? (
                          <p className="mt-2 rounded-md border border-line bg-raised px-3 py-2 text-sm leading-relaxed">
                            {step.hint}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <button
              type="button"
              onClick={() => resetLabProgress(lab.id)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 font-display text-xs font-bold text-muted hover:text-ink"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden />
              Reset step and check ticks
            </button>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
              Checks
            </h2>
            <p className="mt-1 text-sm text-muted">
              {passed} of {auto.length} checks passing — evaluated live from
              your canvas.
            </p>
            <ul className="mt-3 space-y-3">
              {lab.checks.map((check) => {
                if (check.kind === 'self') {
                  const ticked = doneSelfChecks.has(check.id);
                  return (
                    <li key={check.id} className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={ticked}
                        onChange={() => toggleLabSelfCheck(lab.id, check.id)}
                        aria-label={`Self-check: ${check.text}`}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-healthy"
                      />
                      <span className="text-sm leading-relaxed">
                        {check.text}
                        <span className="block text-xs text-muted">
                          Self-check — you tick this yourself
                        </span>
                      </span>
                    </li>
                  );
                }
                const result = evaluateLabCheck(check, checkNodes, checkEdges);
                const pass = result === true;
                return (
                  <li key={check.id} className="flex items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] ${
                        pass ? 'border-healthy bg-leaf' : 'border-line bg-raised'
                      }`}
                      aria-hidden
                    >
                      {pass ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <span className="text-sm leading-relaxed">
                      {check.text}
                      <span className="block font-display text-xs font-bold">
                        {pass ? 'Pass' : 'Fail'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-5 border-t border-line pt-4">
              {completed ? (
                <p className="text-sm font-bold" role="status">
                  Lab complete — well done.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => completeLab(lab.id)}
                    disabled={!allAutoPass}
                    className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-3 py-2 font-display text-sm font-bold shadow-offset disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Check className="h-4 w-4" aria-hidden />
                    Mark lab complete
                  </button>
                  {!allAutoPass ? (
                    <p className="mt-2 text-sm text-muted">
                      {passed} of {auto.length} checks passing — finish the
                      remaining checks to mark this lab complete.
                    </p>
                  ) : null}
                </>
              )}
            </div>
          </Card>

          {showSolution ? (
            <Card className="p-5">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
                Solution
              </h2>
              <p className="mt-2 text-base font-bold">{lab.solution.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {lab.solution.explanation}
              </p>
              <button
                type="button"
                onClick={loadSolution}
                className="mt-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-surface px-3 py-1.5 font-display text-sm font-bold shadow-offset"
              >
                Load solution onto canvas
              </button>
            </Card>
          ) : null}
        </div>

        {/* Center: toolbar, canvas, traffic simulation */}
        <div className="order-2 min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border-[1.5px] border-line bg-surface px-3 py-3">
            <button type="button" onClick={loadStarter} className={toolbarButton}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Load starter
            </button>
            <button
              type="button"
              onClick={() => setShowSolution((value) => !value)}
              aria-expanded={showSolution}
              className={toolbarButton}
            >
              <Eye className="h-4 w-4" aria-hidden />
              {showSolution ? 'Hide solution' : 'Show solution'}
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

          <div className="mt-4 flex flex-col overflow-hidden rounded-xl border-[1.5px] border-line lg:flex-row">
            <LabPalette onAddNode={(item) => addNode(item)} />
            <div
              className={`lab-flow relative h-[480px] min-h-[420px] shrink-0 lg:h-[560px] lg:flex-1 ${playing ? '' : 'sim-paused'}`}
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
          </div>

          <div className="mt-4 rounded-xl border-[1.5px] border-line bg-surface px-4 py-3">
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
          </div>
        </div>

        {/* Right: properties */}
        <div className="order-3 lg:w-[280px] lg:shrink-0">
          <LabProperties
            selectedNode={selectedNode}
            selectedEdge={selectedEdge}
            onUpdateNode={updateNode}
            onDeleteNode={deleteNode}
            onUpdateEdge={updateEdge}
            onDeleteEdge={deleteEdge}
          />
        </div>
      </div>
    </div>
  );
}

export default function LabRunner({ lab }: { lab: Lab }) {
  return <LabRunnerInner lab={lab} />;
}
