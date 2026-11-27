'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Check, Clock, FlaskConical, Play, Wrench } from 'lucide-react';
import { chapters, getAllLessons, TOTAL_LESSONS } from '@/lib/content';
import { nextLesson, percentComplete } from '@/lib/progress';
import { useProgressStore } from '@/store/progress-store';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge, difficultyTone } from '@/components/ui/Badge';
import { MetricCard } from '@/components/ui/MetricCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { chapterColorClass } from '@/components/layout/MobileDrawer';

export default function Home() {
  const completedLessonIds = useProgressStore((state) => state.completedLessonIds);
  const completedSet = new Set(completedLessonIds);
  const completedCount = completedLessonIds.length;
  const percent = percentComplete(completedCount, TOTAL_LESSONS);

  const upcoming = nextLesson(chapters, completedSet);
  const allLessons = getAllLessons();
  const recentlyCompleted = completedLessonIds
    .slice(-3)
    .reverse()
    .map((id) => allLessons.find((lesson) => lesson.id === id))
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined);

  const totalMinutes = allLessons.reduce((sum, lesson) => sum + lesson.durationMin, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      {/* Hero */}
      <section className="max-w-2xl">
        <p className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Interactive system design, step by step
        </p>
        <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-5xl">
          Understand how systems scale.
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-muted">
          Forty short lessons with animated simulations that show what actually
          happens inside a system — from one request to millions of users.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={upcoming ? `/learn/${upcoming.id}` : '/learn'}>
            <Play className="h-4 w-4" aria-hidden />
            {upcoming ? 'Continue Learning' : 'Start Learning'}
          </Button>
          <Button href="/learn" variant="secondary">
            Explore Curriculum
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </section>

      {/* Continue learning + progress */}
      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
            Continue learning
          </p>
          {upcoming ? (
            <>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                Lesson {upcoming.number}: {upcoming.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">{upcoming.intro}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={difficultyTone(upcoming.difficulty)}>{upcoming.difficulty}</Badge>
                <span className="inline-flex items-center gap-1 text-sm text-muted">
                  <Clock className="h-4 w-4" aria-hidden />
                  {upcoming.durationMin} min
                </span>
                {upcoming.comingSoon ? <Badge>Coming soon</Badge> : null}
              </div>
              <div className="mt-5">
                <Button href={`/learn/${upcoming.id}`}>
                  {completedCount === 0 ? 'Start lesson 1' : 'Pick up where you left off'}
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-xl font-bold leading-snug">
                You finished all 40 lessons.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Nice work — the whole curriculum is done. Try a practice quiz
                or design a system of your own in the Design Lab.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button href="/practice">Practice quizzes</Button>
                <Button href="/design-lab" variant="secondary">
                  Open Design Lab
                </Button>
              </div>
            </>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
            Your progress
          </p>
          <p className="mt-2 font-mono text-3xl font-semibold">
            {completedCount}
            <span className="text-lg text-muted"> / {TOTAL_LESSONS} lessons</span>
          </p>
          <div className="mt-3">
            <ProgressBar value={percent} label="Overall lesson progress" showPercent />
          </div>
          {recentlyCompleted.length > 0 ? (
            <div className="mt-5">
              <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
                Recently completed
              </p>
              <ul className="mt-2 space-y-2">
                {recentlyCompleted.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      href={`/learn/${lesson.id}`}
                      className="flex items-center gap-2 text-sm text-ink hover:underline"
                    >
                      <Check className="h-4 w-4 shrink-0 text-healthy" aria-hidden />
                      <span className="min-w-0 truncate">
                        Lesson {lesson.number}: {lesson.title}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">
              No lessons finished yet — lesson 1 takes about 12 minutes.
            </p>
          )}
        </Card>
      </section>

      {/* Quick stats */}
      <section aria-label="Curriculum at a glance" className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard label="Lessons" value={String(TOTAL_LESSONS)} />
        <MetricCard label="Chapters" value={String(chapters.length)} />
        <MetricCard label="Total time" value={String(Math.round(totalMinutes / 60))} unit="hrs" />
        <MetricCard label="Completed" value={String(completedCount)} />
      </section>

      {/* Chapter grid */}
      <section className="mt-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-2xl font-bold">The curriculum</h2>
          <Link href="/learn" className="font-display text-sm font-bold text-ink hover:underline">
            View all lessons →
          </Link>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter) => {
            const doneInChapter = chapter.lessons.filter((lesson) =>
              completedSet.has(lesson.id),
            ).length;
            return (
              <Link key={chapter.id} href={`/learn#chapter-${chapter.id}`} className="group">
                <Card className="h-full p-5 transition-shadow group-hover:shadow-offset">
                  <div className="flex items-center justify-between">
                    <span
                      className={`h-4 w-4 rounded-sm border border-line ${chapterColorClass[chapter.color]}`}
                      aria-hidden
                    />
                    <span className="font-mono text-xs text-muted">
                      Chapter {chapter.number}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold">{chapter.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{chapter.tagline}</p>
                  <p className="mt-4 font-mono text-xs text-muted">
                    {chapter.lessons.length} lessons · {doneInChapter} complete
                  </p>
                  <div className="mt-2">
                    <ProgressBar
                      value={percentComplete(doneInChapter, chapter.lessons.length)}
                      label={`${chapter.title} progress`}
                    />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recommended practice */}
      <section className="mt-10">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl border-[1.5px] border-line bg-sky p-2.5" aria-hidden>
              <FlaskConical className="h-5 w-5 text-ink" />
            </span>
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <BookOpen className="hidden h-5 w-5" aria-hidden />
                Test what you learned
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Short quizzes after each chapter turn watching into knowing.
                Start with the foundations set — no account needed.
              </p>
            </div>
          </div>
          <Button href="/practice" variant="secondary" className="shrink-0">
            Practice quizzes
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Card>
      </section>

      {/* Guided labs */}
      <section className="mt-4">
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="rounded-xl border-[1.5px] border-line bg-amber p-2.5" aria-hidden>
              <Wrench className="h-5 w-5 text-ink" />
            </span>
            <div>
              <h2 className="text-lg font-bold">Build it yourself</h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
                Nine guided hands-on exercises, one per chapter — build the
                system on the canvas, step by step.
              </p>
            </div>
          </div>
          <Button href="/labs" variant="secondary" className="shrink-0">
            Browse labs
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Card>
      </section>
    </div>
  );
}
