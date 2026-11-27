/*
 * Content integrity tests for System Design Studio.
 * These guard the data contracts: 40 lessons across 9 chapters,
 * complete full lessons, a valid quiz bank, cheatsheets with real
 * sections, and a complete URL shortener case study.
 */

import { describe, expect, it } from 'vitest';
import { chapters, allLessons, TOTAL_LESSONS } from '@/data/curriculum';
import { fullLessons } from '@/data/lessons-full';
import { cheatsheets } from '@/data/cheatsheets';
import { caseStudies } from '@/data/case-studies';
import { quizQuestions } from '@/data/quiz';

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
  it('covers the four specified lessons', () => {
    expect(Object.keys(fullLessons).sort()).toEqual(['l1', 'l11', 'l2', 'l5']);
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
