/*
 * Content access: every read of lessons, cheatsheets, case studies
 * and quizzes goes through here. Today the data lives in local files
 * under `data/`; a Supabase backend can replace these imports later
 * without touching any page, because the return shapes stay the same.
 */

import { chapters as catalogChapters, TOTAL_LESSONS } from '@/data/curriculum';
import { fullLessons } from '@/data/lessons-full';
import { cheatsheets } from '@/data/cheatsheets';
import { caseStudies } from '@/data/case-studies';
import { quizQuestions } from '@/data/quiz';
import type { Chapter, Lesson, SearchEntry } from '@/lib/types';

export { TOTAL_LESSONS };
export { cheatsheets, caseStudies, quizQuestions };

/*
 * Chapters with the fully-written lessons merged over the catalog.
 * The catalog marks every lesson comingSoon; the merge clears that
 * flag for the four finished lessons, so sidebars and dashboards
 * never label a finished lesson "Coming soon".
 */
export const chapters: Chapter[] = catalogChapters.map((chapter) => ({
  ...chapter,
  lessons: chapter.lessons.map((lesson) => fullLessons[lesson.id] ?? lesson),
}));

/** All lessons, with the four fully-written lessons merged over the catalog. */
export const allLessons: Lesson[] = chapters.flatMap((c) => c.lessons);

export function getAllLessons(): Lesson[] {
  return allLessons;
}

export function getLesson(id: string): Lesson | undefined {
  return getAllLessons().find((l) => l.id === id);
}

export function getChapter(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getCheatsheet(id: string) {
  return cheatsheets.find((c) => c.id === id);
}

export function getCaseStudy(id: string) {
  return caseStudies.find((c) => c.id === id);
}

/** Flat client-side search index across lessons, cheatsheets and case studies. */
export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];
  for (const lesson of getAllLessons()) {
    entries.push({
      kind: 'lesson',
      id: lesson.id,
      title: `Lesson ${lesson.number}: ${lesson.title}`,
      subtitle: lesson.intro,
      href: `/learn/${lesson.id}`,
      keywords: `${lesson.title} ${lesson.intro} ${lesson.objectives.join(' ')}`.toLowerCase(),
    });
  }
  for (const sheet of cheatsheets) {
    entries.push({
      kind: 'cheatsheet',
      id: sheet.id,
      title: sheet.title,
      subtitle: sheet.summary,
      href: `/cheatsheets/${sheet.id}`,
      keywords: `${sheet.title} ${sheet.category} ${sheet.summary}`.toLowerCase(),
    });
  }
  for (const study of caseStudies) {
    entries.push({
      kind: 'case-study',
      id: study.id,
      title: study.title,
      subtitle: study.problem,
      href: `/case-studies/${study.id}`,
      keywords: `${study.title} ${study.problem}`.toLowerCase(),
    });
  }
  return entries;
}

/** Simple substring search over the index. Empty query returns no results. */
export function searchEntries(query: string): SearchEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  return buildSearchIndex().filter((entry) =>
    words.every((word) => entry.keywords.includes(word) || entry.title.toLowerCase().includes(word)),
  );
}
