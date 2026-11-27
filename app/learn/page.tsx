'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ChevronDown, Clock } from 'lucide-react';
import { chapters, TOTAL_LESSONS } from '@/lib/content';
import { nextLesson, percentComplete } from '@/lib/progress';
import { useProgressStore } from '@/store/progress-store';
import { Badge, difficultyTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { chapterColorClass } from '@/components/layout/MobileDrawer';

export default function LearnPage() {
  const completedLessonIds = useProgressStore((state) => state.completedLessonIds);
  const completedSet = new Set(completedLessonIds);
  const completedCount = completedLessonIds.length;
  const percent = percentComplete(completedCount, TOTAL_LESSONS);
  const upcoming = nextLesson(chapters, completedSet);

  // First chapter starts open; the learner can open any other chapter.
  const [openChapterId, setOpenChapterId] = useState<string | null>(chapters[0]?.id ?? null);

  function toggleChapter(chapterId: string) {
    setOpenChapterId((current) => (current === chapterId ? null : chapterId));
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Learn
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">The curriculum</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
          Nine chapters, forty lessons. Each lesson is a short read with an
          animated simulation of the system it teaches.
        </p>
      </header>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-sm font-bold">Overall progress</p>
          <p className="font-mono text-sm text-muted">
            {completedCount} of {TOTAL_LESSONS} lessons · {percent}%
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar value={percent} label="Overall lesson progress" />
        </div>
        {upcoming ? (
          <p className="mt-3 text-sm text-muted">
            Up next:{' '}
            <Link href={`/learn/${upcoming.id}`} className="font-bold text-ink hover:underline">
              Lesson {upcoming.number}: {upcoming.title}
            </Link>
          </p>
        ) : (
          <p className="mt-3 text-sm text-muted">
            All 40 lessons complete — well done.
          </p>
        )}
      </Card>

      <div className="mt-8 space-y-4">
        {chapters.map((chapter) => {
          const doneInChapter = chapter.lessons.filter((lesson) =>
            completedSet.has(lesson.id),
          ).length;
          const isOpen = openChapterId === chapter.id;

          return (
            <section
              key={chapter.id}
              id={`chapter-${chapter.id}`}
              aria-label={`Chapter ${chapter.number}: ${chapter.title}`}
              className="scroll-mt-20"
            >
              <Card>
                <button
                  type="button"
                  onClick={() => toggleChapter(chapter.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-4 text-left sm:px-5"
                >
                  <span
                    className={`h-5 w-5 shrink-0 rounded-sm border border-line ${chapterColorClass[chapter.color]}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-base font-bold sm:text-lg">
                      {chapter.number}. {chapter.title}
                    </span>
                    <span className="block truncate text-sm text-muted">{chapter.tagline}</span>
                  </span>
                  <span className="hidden shrink-0 font-mono text-xs text-muted sm:block">
                    {doneInChapter}/{chapter.lessons.length} done
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    aria-hidden
                  />
                </button>

                {isOpen ? (
                  <ul className="border-t border-line">
                    {chapter.lessons.map((lesson) => {
                      const done = completedSet.has(lesson.id);
                      const isNext = upcoming?.id === lesson.id;
                      return (
                        <li key={lesson.id} className="border-b border-line last:border-b-0">
                          <Link
                            href={`/learn/${lesson.id}`}
                            aria-current={isNext ? 'step' : undefined}
                            className={`flex items-center gap-3 px-4 py-3.5 hover:bg-raised sm:px-5 ${
                              isNext ? 'bg-leaf/40' : ''
                            }`}
                          >
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] font-mono text-xs font-bold ${
                                done
                                  ? 'border-healthy bg-leaf text-ink'
                                  : 'border-line bg-raised text-muted'
                              }`}
                              aria-hidden
                            >
                              {done ? <Check className="h-4 w-4" /> : lesson.number}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-ink sm:text-base">
                                {lesson.title}
                                {isNext ? (
                                  <span className="ml-2 hidden font-display text-xs font-bold text-muted sm:inline">
                                    · Up next
                                  </span>
                                ) : null}
                              </span>
                              <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                                <Clock className="h-3.5 w-3.5" aria-hidden />
                                {lesson.durationMin} min
                              </span>
                            </span>
                            {lesson.comingSoon ? (
                              <Badge>Coming soon</Badge>
                            ) : (
                              <Badge tone={difficultyTone(lesson.difficulty)}>
                                {lesson.difficulty}
                              </Badge>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </Card>
            </section>
          );
        })}
      </div>
    </div>
  );
}
