'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { chapters, TOTAL_LESSONS } from '@/lib/content';
import { percentComplete } from '@/lib/progress';
import { useProgressStore } from '@/store/progress-store';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { chapterColorClass } from '@/components/layout/MobileDrawer';

interface CourseSidebarProps {
  activeLessonId: string;
  className?: string;
}

/*
 * The course tree shown beside every lesson on desktop.
 * Same data as the mobile drawer, different layout — the tree
 * itself is the single source of truth for chapter order.
 */
export function CourseSidebar({ activeLessonId, className = '' }: CourseSidebarProps) {
  const completedLessonIds = useProgressStore((state) => state.completedLessonIds);
  const completedCount = completedLessonIds.length;

  return (
    <aside className={`w-full shrink-0 lg:w-[280px] ${className}`} aria-label="Course contents">
      <div className="lg:sticky lg:top-20">
        <div className="rounded-xl border-[1.5px] border-line bg-surface p-4">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
            Your progress
          </p>
          <p className="mt-1 font-mono text-sm">
            {completedCount} of {TOTAL_LESSONS} lessons
          </p>
          <div className="mt-2">
            <ProgressBar
              value={percentComplete(completedCount, TOTAL_LESSONS)}
              label="Overall lesson progress"
            />
          </div>
        </div>

        <nav aria-label="Chapters" className="mt-4 space-y-4">
          {chapters.map((chapter) => {
            const doneInChapter = chapter.lessons.filter((lesson) =>
              completedLessonIds.includes(lesson.id),
            ).length;
            return (
              <div key={chapter.id}>
                <p className="flex items-center gap-2 px-1 font-display text-xs font-bold uppercase tracking-wide text-muted">
                  <span
                    className={`h-3 w-3 rounded-sm border border-line ${chapterColorClass[chapter.color]}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate">
                    {chapter.number}. {chapter.title}
                  </span>
                  <span className="font-mono font-normal normal-case">
                    {doneInChapter}/{chapter.lessons.length}
                  </span>
                </p>
                <ul className="mt-1.5 space-y-0.5">
                  {chapter.lessons.map((lesson) => {
                    const done = completedLessonIds.includes(lesson.id);
                    const active = lesson.id === activeLessonId;
                    return (
                      <li key={lesson.id}>
                        <Link
                          href={`/learn/${lesson.id}`}
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                            active
                              ? 'bg-leaf font-bold text-ink'
                              : 'text-muted hover:bg-surface hover:text-ink'
                          }`}
                        >
                          {done ? (
                            <Check className="h-4 w-4 shrink-0 text-healthy" aria-label="Completed" />
                          ) : (
                            <span
                              className="flex h-4 w-4 shrink-0 items-center justify-center font-mono text-[11px]"
                              aria-hidden
                            >
                              {lesson.number}
                            </span>
                          )}
                          <span className="min-w-0 flex-1 truncate">{lesson.title}</span>
                          {lesson.comingSoon ? (
                            <span className="shrink-0 rounded-full border border-line bg-raised px-1.5 py-0.5 font-display text-[10px] font-bold text-muted">
                              Soon
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
