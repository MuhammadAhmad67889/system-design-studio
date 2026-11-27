/*
 * Content integrity tests for System Design Studio.
 * These guard the data contracts: 40 lessons across 9 chapters,
 * complete full lessons, a valid quiz bank, cheatsheets with real
 * sections, and a complete URL shortener case study.
 */

import { describe, expect, it } from 'vitest';
import { chapters, allLessons, TOTAL_LESSONS } from '@/data/curriculum';
import { fullLessons } from '@/data/lessons-full';
import { allLabs, TOTAL_LABS } from '@/data/labs';
import { autoChecks, evaluateLabCheck } from '@/lib/labs';
import type { CheckEdge, CheckNode } from '@/lib/labs';
import type { LabTemplate } from '@/lib/types';
import { cheatsheets } from '@/data/cheatsheets';
import { caseStudies } from '@/data/case-studies';
import { quizQuestions } from '@/data/quiz';

/** Reduce a lab template to the node/edge shapes the checker reads. */
function templateToGraph(template: LabTemplate): { nodes: CheckNode[]; edges: CheckEdge[] } {
  return {
    nodes: template.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
    })),
    edges: template.edges.map((edge) => ({ source: edge.from, target: edge.to })),
  };
}

describe('curriculum', () => {
  it('has 40 lessons across 9 chapters', () => {
    expect(chapters).toHaveLength(9);
    expect(allLessons).toHaveLength(40);
    expect(TOTAL_LESSONS).toBe(40);
    expect(chapters.flatMap((c) => c.lessons)).toHaveLength(40);
  });

  it('has unique lesson ids', () => {
    const ids = allLessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique chapter ids', () => {
    const ids = chapters.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('full lessons', () => {
  it('covers all 40 lessons', () => {
    const expected = Array.from({ length: 40 }, (_, i) => `l${i + 1}`);
    expect(Object.keys(fullLessons).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)))).toEqual(expected);
  });

  it('gives every full lesson at least 4 steps', () => {
    for (const lesson of Object.values(fullLessons)) {
      expect(lesson.steps.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('gives every step a non-empty diagram caption and at least 1 metric', () => {
    for (const lesson of Object.values(fullLessons)) {
      for (const step of lesson.steps) {
        expect(step.diagram.caption.trim().length).toBeGreaterThan(0);
        expect(step.metrics.length).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('keeps full lesson ids inside the curriculum', () => {
    const catalogIds = new Set(allLessons.map((l) => l.id));
    for (const id of Object.keys(fullLessons)) {
      expect(catalogIds.has(id)).toBe(true);
    }
  });
});

describe('quiz', () => {
  it('has 10 questions', () => {
    expect(quizQuestions).toHaveLength(10);
  });

  it('gives every question 4 options and an answerIndex of 0-3', () => {
    for (const q of quizQuestions) {
      expect(q.options).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThanOrEqual(3);
      expect(Number.isInteger(q.answerIndex)).toBe(true);
    }
  });

  it('points every question at a real lesson', () => {
    const catalogIds = new Set(allLessons.map((l) => l.id));
    for (const q of quizQuestions) {
      expect(q.lessonId).toBeDefined();
      expect(catalogIds.has(q.lessonId as string)).toBe(true);
    }
  });
});

describe('cheatsheets', () => {
  it('has 4 cheatsheets', () => {
    expect(cheatsheets).toHaveLength(4);
  });

  it('gives every cheatsheet at least 3 sections', () => {
    for (const sheet of cheatsheets) {
      expect(sheet.sections.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('points related lessons at real lesson ids', () => {
    const catalogIds = new Set(allLessons.map((l) => l.id));
    for (const sheet of cheatsheets) {
      for (const id of sheet.relatedLessons ?? []) {
        expect(catalogIds.has(id)).toBe(true);
      }
    }
  });
});

describe('case studies', () => {
  it('has the URL shortener case study with non-empty requirements, estimates, and apis', () => {
    const study = caseStudies.find((c) => c.id === 'url-shortener');
    expect(study).toBeDefined();
    expect(study?.requirements.length).toBeGreaterThan(0);
    expect(study?.estimates.length).toBeGreaterThan(0);
    expect(study?.apis.length).toBeGreaterThan(0);
  });
});

describe('labs', () => {
  it('has 9 labs, one per chapter, numbered 1–9', () => {
    expect(allLabs).toHaveLength(9);
    expect(TOTAL_LABS).toBe(9);
    expect(allLabs.map((lab) => lab.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(new Set(allLabs.map((lab) => lab.id)).size).toBe(9);
    expect(new Set(allLabs.map((lab) => lab.chapterId)).size).toBe(9);
  });

  it('points every lab at a real chapter and real lessons', () => {
    const chapterIds = new Set(chapters.map((c) => c.id));
    const lessonIds = new Set(allLessons.map((l) => l.id));
    for (const lab of allLabs) {
      expect(chapterIds.has(lab.chapterId)).toBe(true);
      expect(lab.relatedLessons.length).toBeGreaterThan(0);
      for (const id of lab.relatedLessons) {
        expect(lessonIds.has(id)).toBe(true);
      }
    }
  });

  it('gives every lab 4+ steps, each with an instruction and a hint', () => {
    for (const lab of allLabs) {
      expect(lab.goal.trim().length).toBeGreaterThan(0);
      expect(lab.whyItMatters.trim().length).toBeGreaterThan(0);
      expect(lab.estMin).toBeGreaterThanOrEqual(10);
      expect(lab.estMin).toBeLessThanOrEqual(30);
      expect(lab.steps.length).toBeGreaterThanOrEqual(4);
      for (const step of lab.steps) {
        expect(step.instruction.trim().length).toBeGreaterThan(0);
        expect(step.hint.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('gives every lab at least one auto check and one labelled self-check', () => {
    for (const lab of allLabs) {
      expect(autoChecks(lab).length).toBeGreaterThanOrEqual(1);
      expect(lab.checks.filter((c) => c.kind === 'self').length).toBeGreaterThanOrEqual(1);
      const checkIds = lab.checks.map((c) => c.id);
      expect(new Set(checkIds).size).toBe(checkIds.length);
    }
  });

  it('keeps starter and solution templates valid: unique node ids, edges point at real nodes', () => {
    const validKinds = new Set([
      'user', 'client', 'dns', 'lb', 'gateway', 'server', 'db', 'cache', 'queue', 'cdn', 'service',
    ]);
    for (const lab of allLabs) {
      for (const template of [lab.starter, lab.solution.template]) {
        const ids = template.nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const node of template.nodes) {
          expect(validKinds.has(node.kind)).toBe(true);
          expect(node.label.trim().length).toBeGreaterThan(0);
        }
        const idSet = new Set(ids);
        for (const edge of template.edges) {
          expect(idSet.has(edge.from)).toBe(true);
          expect(idSet.has(edge.to)).toBe(true);
        }
      }
    }
  });

  it('passes every auto check on the solution template', () => {
    for (const lab of allLabs) {
      const { nodes, edges } = templateToGraph(lab.solution.template);
      for (const check of autoChecks(lab)) {
        expect(evaluateLabCheck(check, nodes, edges)).toBe(true);
      }
    }
  });

  it('fails at least one auto check on the starter template, so checks grade real work', () => {
    for (const lab of allLabs) {
      const { nodes, edges } = templateToGraph(lab.starter);
      const results = autoChecks(lab).map((check) =>
        evaluateLabCheck(check, nodes, edges),
      );
      expect(results).toContain(false);
    }
  });
});
