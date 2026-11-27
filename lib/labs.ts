/*
 * Guided labs: data access and the canvas checker.
 *
 * Checks are the honest core of a lab: they read the learner's
 * actual canvas (nodes and edges) and answer pass/fail. A `self`
 * check is never evaluated here — it returns null, and the UI must
 * label it as a self-check the learner ticks themselves.
 *
 * Everything here is pure and testable; the React Flow node/edge
 * shapes are reduced to the minimal { id, kind, label } /
 * { source, target } the checker needs.
 */

import { allLabs, TOTAL_LABS } from '@/data/labs';
import type { Lab, LabCheck, NodeKind } from '@/lib/types';

export { TOTAL_LABS };
export { allLabs };

export function getLab(id: string): Lab | undefined {
  return allLabs.find((lab) => lab.id === id);
}

/** Minimal node shape the checker reads. */
export interface CheckNode {
  id: string;
  kind: NodeKind;
  label: string;
}

/** Minimal edge shape the checker reads. */
export interface CheckEdge {
  source: string;
  target: string;
}

/** Nodes of a kind, optionally filtered by a label substring. */
export function countNodesOfKind(
  nodes: CheckNode[],
  kind: NodeKind,
  label?: string,
): number {
  return nodes.filter(
    (node) =>
      node.kind === kind &&
      (label === undefined ||
        node.label.toLowerCase().includes(label.toLowerCase())),
  ).length;
}

/** Is there a direct edge between a node of one kind and a node of another (either direction)? */
export function hasEdgeBetweenKinds(
  nodes: CheckNode[],
  edges: CheckEdge[],
  fromKind: NodeKind,
  toKind: NodeKind,
): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node.kind]));
  return edges.some((edge) => {
    const sourceKind = byId.get(edge.source);
    const targetKind = byId.get(edge.target);
    return (
      (sourceKind === fromKind && targetKind === toKind) ||
      (sourceKind === toKind && targetKind === fromKind)
    );
  });
}

/**
 * Is there a path between a node of one kind and a node of another,
 * following edges in either direction? Breadth-first search over
 * the undirected canvas graph.
 */
export function hasPathBetweenKinds(
  nodes: CheckNode[],
  edges: CheckEdge[],
  fromKind: NodeKind,
  toKind: NodeKind,
): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const neighbours = new Map<string, string[]>();
  for (const edge of edges) {
    if (!byId.has(edge.source) || !byId.has(edge.target)) continue;
    neighbours.set(edge.source, [...(neighbours.get(edge.source) ?? []), edge.target]);
    neighbours.set(edge.target, [...(neighbours.get(edge.target) ?? []), edge.source]);
  }
  const starts = nodes.filter((node) => node.kind === fromKind).map((node) => node.id);
  const targets = new Set(
    nodes.filter((node) => node.kind === toKind).map((node) => node.id),
  );
  const seen = new Set<string>();
  const queue = [...starts];
  while (queue.length > 0) {
    const current = queue.shift() as string;
    if (targets.has(current)) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const next of neighbours.get(current) ?? []) {
      if (!seen.has(next)) queue.push(next);
    }
  }
  return false;
}

/**
 * Evaluate one check against the canvas. Returns true/false for auto
 * checks, and null for `self` checks (never auto-evaluated).
 */
export function evaluateLabCheck(
  check: LabCheck,
  nodes: CheckNode[],
  edges: CheckEdge[],
): boolean | null {
  switch (check.kind) {
    case 'has-node':
      return countNodesOfKind(nodes, check.nodeKind, check.label) >= check.minCount;
    case 'has-edge':
      return hasEdgeBetweenKinds(nodes, edges, check.fromKind, check.toKind);
    case 'has-path':
      return hasPathBetweenKinds(nodes, edges, check.fromKind, check.toKind);
    case 'no-direct-edge':
      return !hasEdgeBetweenKinds(nodes, edges, check.fromKind, check.toKind);
    case 'self':
      return null;
  }
}

/** Auto checks only (the ones the checker can grade). */
export function autoChecks(lab: Lab): LabCheck[] {
  return lab.checks.filter((check) => check.kind !== 'self');
}

/** How many auto checks currently pass on this canvas. */
export function passedAutoCheckCount(
  lab: Lab,
  nodes: CheckNode[],
  edges: CheckEdge[],
): number {
  return autoChecks(lab).filter(
    (check) => evaluateLabCheck(check, nodes, edges) === true,
  ).length;
}
