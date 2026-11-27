/*
 * Core content types for System Design Studio.
 *
 * Everything the UI renders comes from these shapes, so lessons,
 * cheatsheets, case studies and quizzes are data — never hardcoded pages.
 * The data layer is local-first: typed data files in `data/`. A Supabase
 * backend can replace those files later without changing the UI, because
 * every read goes through the helpers in `lib/content.ts`.
 */

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced';

/** A single metric shown in a lesson's metric strip. */
export interface SimMetric {
  label: string;
  value: string;
  unit?: string;
  /** Visual tone; never the only signal — the label always carries meaning. */
  tone?: 'default' | 'good' | 'warn' | 'bad';
}

export type NodeKind =
  | 'user'
  | 'client'
  | 'dns'
  | 'lb'
  | 'gateway'
  | 'server'
  | 'db'
  | 'cache'
  | 'queue'
  | 'cdn'
  | 'service';

export type NodeStatus = 'healthy' | 'busy' | 'degraded' | 'failed' | 'idle';

/** One box in a simulation diagram. Positions are in a 720x360 viewBox. */
export interface DiagramNode {
  id: string;
  kind: NodeKind;
  label: string;
  sublabel?: string;
  x: number;
  y: number;
  status?: NodeStatus;
  /** Short note shown under the node, e.g. "1 of 3 servers". */
  note?: string;
}

export type EdgeKind = 'request' | 'response' | 'replication' | 'async';

/** A connection between two diagram nodes. */
export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
  kind?: EdgeKind;
}

/** Everything a simulation step needs to draw. */
export interface DiagramConfig {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  /** Node ids to highlight in this step. */
  activeNodeIds?: string[];
  /** Edge ids ("from->to") that carry particles in this step. */
  activeEdgeIds?: string[];
  /** One-line plain-text summary of the diagram, for screen readers. */
  caption: string;
}

/** One numbered step inside a lesson. */
export interface LessonStep {
  id: string;
  title: string;
  explanation: string;
  metrics: SimMetric[];
  /** What changed compared with the previous step. */
  changed: string[];
  goodToKnow?: string;
  takeaway: string;
  diagram: DiagramConfig;
}

export interface LessonFormula {
  name: string;
  expression: string;
  note: string;
}

export interface Lesson {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  durationMin: number;
  difficulty: Difficulty;
  intro: string;
  objectives: string[];
  steps: LessonStep[];
  summary: string;
  /** True while the lesson has no full content yet. The UI shows it as coming soon. */
  comingSoon?: boolean;
  formulas?: LessonFormula[];
  relatedCheatsheets?: string[];
  relatedCaseStudies?: string[];
}

export type ChapterColor = 'leaf' | 'amber' | 'sky' | 'lilac';

export interface Chapter {
  id: string;
  number: number;
  title: string;
  tagline: string;
  color: ChapterColor;
  lessons: Lesson[];
}

export interface CheatsheetSection {
  heading: string;
  body: string;
  bullets?: string[];
  formula?: string;
}

export interface Cheatsheet {
  id: string;
  title: string;
  category: string;
  summary: string;
  difficulty: Difficulty;
  readMin: number;
  sections: CheatsheetSection[];
  relatedLessons?: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  difficulty: Difficulty;
  estMin: number;
  problem: string;
  requirements: string[];
  estimates: { label: string; value: string; note: string }[];
  apis: { method: string; path: string; desc: string }[];
  dataModel: string[];
  architecture: string[];
  tradeoffs: { choice: string; pro: string; con: string }[];
  bottlenecks: string[];
}

export interface QuizQuestion {
  id: string;
  topic: string;
  difficulty: Difficulty;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  hint: string;
  lessonId?: string;
}

/** One entry in the client-side search index. */
export interface SearchEntry {
  kind: 'lesson' | 'cheatsheet' | 'case-study' | 'quiz';
  id: string;
  title: string;
  subtitle: string;
  href: string;
  keywords: string;
}

/** A node on the Design Lab canvas. */
export interface LabNodeData {
  label: string;
  kind: NodeKind;
  description?: string;
  capacity?: string;
  status?: NodeStatus;
}

export interface DesignProject {
  id: string;
  name: string;
  updatedAt: string;
  nodes: { id: string; kind: NodeKind; label: string; x: number; y: number; data: LabNodeData }[];
  edges: { id: string; source: string; target: string; label?: string }[];
}

/*
 * Guided labs: one hands-on exercise per chapter. A lab is data —
 * steps the learner follows on the Design Lab canvas, a starter
 * template that loads onto the canvas, checks that read the canvas,
 * and a solution template the learner can reveal and load.
 */

/** One node in a lab template (starter or solution). Flow coordinates. */
export interface LabTemplateNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  description?: string;
  capacity?: string;
}

export interface LabTemplateEdge {
  from: string;
  to: string;
  label?: string;
}

/** Nodes and edges a lab loads onto the canvas. */
export interface LabTemplate {
  nodes: LabTemplateNode[];
  edges: LabTemplateEdge[];
}

/**
 * One check on the learner's canvas. Auto checks are evaluated by
 * `evaluateLabCheck` in lib/labs.ts; a `self` check is a checklist
 * item the learner ticks themselves and is always labelled as such
 * in the UI — it never pretends to verify anything.
 */
export type LabCheck =
  | {
      id: string;
      kind: 'has-node';
      nodeKind: NodeKind;
      minCount: number;
      /** Optional label substring the node must carry, e.g. 'Metrics'. */
      label?: string;
      text: string;
    }
  | {
      id: string;
      kind: 'has-edge';
      fromKind: NodeKind;
      toKind: NodeKind;
      text: string;
    }
  | {
      id: string;
      kind: 'has-path';
      fromKind: NodeKind;
      toKind: NodeKind;
      text: string;
    }
  | {
      id: string;
      kind: 'no-direct-edge';
      fromKind: NodeKind;
      toKind: NodeKind;
      text: string;
    }
  | { id: string; kind: 'self'; text: string };

/** One numbered step inside a lab. Plain language, one job per step. */
export interface LabStep {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  /** Palette item id to point the learner at, e.g. 'lb'. */
  paletteItemId?: string;
}

export interface Lab {
  id: string;
  chapterId: string;
  number: number;
  title: string;
  goal: string;
  whyItMatters: string;
  difficulty: Difficulty;
  estMin: number;
  steps: LabStep[];
  starter: LabTemplate;
  checks: LabCheck[];
  solution: {
    title: string;
    explanation: string;
    template: LabTemplate;
  };
  relatedLessons: string[];
}
