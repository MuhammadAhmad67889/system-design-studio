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

interface ProgressState {
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  quizBest: Record<string, number>;
  completeLesson: (lessonId: string) => void;
  uncompleteLesson: (lessonId: string) => void;
  toggleBookmark: (lessonId: string) => void;
  recordQuizScore: (quizId: string, score: number) => void;
}

function without(list: string[], id: string): string[] {
  return list.filter((item) => item !== id);
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      completedLessonIds: [],
      bookmarkedLessonIds: [],
      quizBest: {},
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
    }),
    { name: STORAGE_KEY },
  ),
);
