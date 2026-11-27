/*
 * Shared helpers for writing fully-written lessons.
 *
 * The first four lessons (l1, l2, l5, l11) define these helpers locally
 * inside data/lessons-full.ts. The remaining lessons live in separate
 * part files (data/lessons-part-*.ts) and import the same helpers from
 * here, so every lesson is built from identical pieces.
 *
 * All metric values in every lesson are illustrative: small, plausible
 * numbers chosen to show how a system behaves, not measurements from
 * a real deployment. Lessons that use metrics say so in their summary.
 */

import type { DiagramEdge, DiagramNode, LessonStep, NodeKind, SimMetric } from '@/lib/types';

export function metric(label: string, value: string, unit?: string, tone?: SimMetric['tone']): SimMetric {
  return { label, value, unit, tone };
}

export function node(
  id: string,
  kind: NodeKind,
  label: string,
  x: number,
  y: number,
  extra?: Partial<DiagramNode>,
): DiagramNode {
  return { id, kind, label, x, y, ...extra };
}

export function edge(from: string, to: string, label?: string, kind?: DiagramEdge['kind']): DiagramEdge {
  return { from, to, label, kind };
}

export function step(
  id: string,
  title: string,
  explanation: string,
  metrics: SimMetric[],
  changed: string[],
  goodToKnow: string,
  takeaway: string,
  diagram: LessonStep['diagram'],
): LessonStep {
  return { id, title, explanation, metrics, changed, goodToKnow, takeaway, diagram };
}

export const ILLUSTRATIVE =
  'All metric values in this lesson are illustrative — small, plausible numbers chosen to show how a system behaves, not measurements from a real deployment.';
