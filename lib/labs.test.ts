/*
 * Tests for the lab checker: node counts, direct edges, paths
 * through the canvas, and the rule that self-checks are never
 * auto-graded (they return null).
 */

import { describe, expect, it } from 'vitest';
import {
  countNodesOfKind,
  evaluateLabCheck,
  hasEdgeBetweenKinds,
  hasPathBetweenKinds,
  passedAutoCheckCount,
} from '@/lib/labs';
import type { CheckEdge, CheckNode } from '@/lib/labs';
import type { Lab, LabCheck } from '@/lib/types';

const nodes: CheckNode[] = [
  { id: 'users', kind: 'client', label: 'Users' },
  { id: 'lb', kind: 'lb', label: 'Load Balancer' },
  { id: 'app1', kind: 'server', label: 'App Server 1' },
  { id: 'app2', kind: 'server', label: 'App Server 2' },
  { id: 'db', kind: 'db', label: 'SQL Database' },
];

const edges: CheckEdge[] = [
  { source: 'users', target: 'lb' },
  { source: 'lb', target: 'app1' },
  { source: 'lb', target: 'app2' },
  { source: 'app1', target: 'db' },
];

describe('countNodesOfKind', () => {
  it('counts nodes of a kind', () => {
    expect(countNodesOfKind(nodes, 'server')).toBe(2);
    expect(countNodesOfKind(nodes, 'lb')).toBe(1);
    expect(countNodesOfKind(nodes, 'cache')).toBe(0);
  });

  it('filters by label substring, case-insensitive', () => {
    expect(countNodesOfKind(nodes, 'server', 'App Server 1')).toBe(1);
    expect(countNodesOfKind(nodes, 'server', 'app server')).toBe(2);
    expect(countNodesOfKind(nodes, 'server', 'Nope')).toBe(0);
  });
});

describe('hasEdgeBetweenKinds', () => {
  it('finds a direct edge in either direction', () => {
    expect(hasEdgeBetweenKinds(nodes, edges, 'lb', 'server')).toBe(true);
    expect(hasEdgeBetweenKinds(nodes, edges, 'server', 'lb')).toBe(true);
    expect(hasEdgeBetweenKinds(nodes, edges, 'server', 'db')).toBe(true);
  });

  it('returns false when no direct edge exists', () => {
    expect(hasEdgeBetweenKinds(nodes, edges, 'client', 'db')).toBe(false);
    expect(hasEdgeBetweenKinds(nodes, edges, 'lb', 'db')).toBe(false);
  });
});

describe('hasPathBetweenKinds', () => {
  it('finds a path through intermediate nodes', () => {
    expect(hasPathBetweenKinds(nodes, edges, 'client', 'db')).toBe(true);
    expect(hasPathBetweenKinds(nodes, edges, 'client', 'server')).toBe(true);
  });

  it('returns false when the graph is disconnected', () => {
    const cut = edges.filter((edge) => edge.source !== 'app1');
    expect(hasPathBetweenKinds(nodes, cut, 'client', 'db')).toBe(false);
  });

  it('returns false when a kind is missing entirely', () => {
    expect(hasPathBetweenKinds(nodes, edges, 'client', 'cache')).toBe(false);
  });
});

describe('evaluateLabCheck', () => {
  it('grades has-node checks against minCount', () => {
    const check: LabCheck = {
      id: 'c1',
      kind: 'has-node',
      nodeKind: 'server',
      minCount: 2,
      text: 'Two servers',
    };
    expect(evaluateLabCheck(check, nodes, edges)).toBe(true);
    expect(evaluateLabCheck({ ...check, minCount: 3 }, nodes, edges)).toBe(false);
  });

  it('grades no-direct-edge checks', () => {
    const check: LabCheck = {
      id: 'c2',
      kind: 'no-direct-edge',
      fromKind: 'client',
      toKind: 'db',
      text: 'No direct user-to-database edge',
    };
    expect(evaluateLabCheck(check, nodes, edges)).toBe(true);
    expect(
      evaluateLabCheck(check, nodes, [...edges, { source: 'users', target: 'db' }]),
    ).toBe(false);
  });

  it('never grades self checks', () => {
    const check: LabCheck = { id: 'c3', kind: 'self', text: 'I can trace the path' };
    expect(evaluateLabCheck(check, nodes, edges)).toBe(null);
  });
});

describe('passedAutoCheckCount', () => {
  it('counts only passing auto checks, ignoring self checks', () => {
    const lab = {
      checks: [
        { id: 'a', kind: 'has-node', nodeKind: 'server', minCount: 2, text: 'x' },
        { id: 'b', kind: 'has-node', nodeKind: 'cache', minCount: 1, text: 'x' },
        { id: 'c', kind: 'self', text: 'x' },
      ],
    } as Lab;
    expect(passedAutoCheckCount(lab, nodes, edges)).toBe(1);
  });
});
