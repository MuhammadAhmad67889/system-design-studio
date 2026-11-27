/*
 * Guest progress store (Zustand + localStorage).
 *
 * No account is needed to learn: completed lessons, bookmarks and
 * quiz best scores live in the browser. When Supabase auth lands,
 * this same shape syncs to the server — the store API stays the same.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'sds-progress-v1';

export interface LabProgressEntry {
  doneSteps: string[];
  doneSelfChecks: string[];
  completed: boolean;
}

interface ProgressState {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  quizBest: Record<string, number>;
  labProgress: Record<string, LabProgressEntry>;
  completeLesson: (lessonId: string) => void;
  uncompleteLesson: (lessonId: string) => void;
  toggleBookmark: (lessonId: string) => void;
  recordQuizScore: (quizId: string, score: number) => void;
  toggleLabStep: (labId: string, stepId: string) => void;
  toggleLabSelfCheck: (labId: string, checkId: string) => void;
  completeLab: (labId: string) => void;
  resetLabProgress: (labId: string) => void;
}

function without(list: string[], id: string): string[] {
  return list.filter((item) => item !== id);
}

function emptyLabProgress(): LabProgressEntry {
  return { doneSteps: [], doneSelfChecks: [], completed: false };
}

function withLabEntry(
  progress: Record<string, LabProgressEntry>,
  labId: string,
  patch: Partial<LabProgressEntry>,
): Record<string, LabProgressEntry> {
  return {
    ...progress,
    [labId]: { ...(progress[labId] ?? emptyLabProgress()), ...patch },
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessonIds: [],
      bookmarkedLessonIds: [],
      quizBest: {},
      labProgress: {},
      completeLesson: (lessonId) =>
        set((state) =>
          state.completedLessonIds.includes(lessonId)
            ? state
            : { completedLessonIds: [...state.completedLessonIds, lessonId] },
        ),
      uncompleteLesson: (lessonId) =>
        set((state) => ({ completedLessonIds: without(state.completedLessonIds, lessonId) })),
      toggleBookmark: (lessonId) =>
        set((state) => ({
          bookmarkedLessonIds: state.bookmarkedLessonIds.includes(lessonId)
            ? without(state.bookmarkedLessonIds, lessonId)
            : [...state.bookmarkedLessonIds, lessonId],
        })),
      recordQuizScore: (quizId, score) =>
        set((state) => ({
          quizBest: {
            ...state.quizBest,
            [quizId]: Math.max(state.quizBest[quizId] ?? 0, score),
          },
        })),
      toggleLabStep: (labId, stepId) =>
        set((state) => {
          const entry = state.labProgress[labId] ?? emptyLabProgress();
          const doneSteps = entry.doneSteps.includes(stepId)
            ? without(entry.doneSteps, stepId)
            : [...entry.doneSteps, stepId];
          return { labProgress: withLabEntry(state.labProgress, labId, { doneSteps }) };
        }),
      toggleLabSelfCheck: (labId, checkId) =>
        set((state) => {
          const entry = state.labProgress[labId] ?? emptyLabProgress();
          const doneSelfChecks = entry.doneSelfChecks.includes(checkId)
            ? without(entry.doneSelfChecks, checkId)
            : [...entry.doneSelfChecks, checkId];
          return {
            labProgress: withLabEntry(state.labProgress, labId, { doneSelfChecks }),
          };
        }),
      completeLab: (labId) =>
        set((state) => ({
          labProgress: withLabEntry(state.labProgress, labId, { completed: true }),
        })),
      resetLabProgress: (labId) =>
        set((state) => {
          const next = { ...state.labProgress };
          delete next[labId];
          return { labProgress: next };
        }),
    }),
    { name: STORAGE_KEY },
  ),
);
