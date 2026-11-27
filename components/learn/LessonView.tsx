'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lightbulb,
  Menu,
  Target,
} from 'lucide-react';
import { chapters, getChapter, getLesson, TOTAL_LESSONS } from '@/lib/content';
import { followingLesson, previousLesson } from '@/lib/progress';
import { useProgressStore } from '@/store/progress-store';
import { useSimulationStore } from '@/store/simulation-store';
import { SimulationPlayer } from '@/components/simulation/SimulationPlayer';
import { CourseSidebar } from '@/components/learn/CourseSidebar';
import { MobileDrawer } from '@/components/layout/MobileDrawer';
import { Button } from '@/components/ui/Button';
import { Badge, difficultyTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import type { Lesson } from '@/lib/types';

interface LessonViewProps {
  lessonId: string;
}

export function LessonView({ lessonId }: LessonViewProps) {
  const lesson = getLesson(lessonId);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const completeLesson = useProgressStore((state) => state.completeLesson);
  const uncompleteLesson = useProgressStore((state) => state.uncompleteLesson);
  const completedLessonIds = useProgressStore((state) => state.completedLessonIds);
  const bookmarkedLessonIds = useProgressStore((state) => state.bookmarkedLessonIds);
  const toggleBookmark = useProgressStore((state) => state.toggleBookmark);

  const step = useSimulationStore((state) => state.step);
  const initSimulation = useSimulationStore((state) => state.init);
  const goToStep = useSimulationStore((state) => state.goToStep);
  const nextStep = useSimulationStore((state) => state.nextStep);
  const prevStep = useSimulationStore((state) => state.prevStep);

  // Reset the simulation whenever the lesson changes.
  useEffect(() => {
    initSimulation(lesson?.steps.length ?? 1);
  }, [lesson?.id, lesson?.steps.length, initSimulation]);

  if (!lesson) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="text-2xl font-bold">Lesson not found</h1>
        <p className="mt-2 text-muted">That lesson does not exist in the curriculum.</p>
        <div className="mt-6">
          <Button href="/learn">Back to the curriculum</Button>
        </div>
      </div>
    );
  }

  const chapter = getChapter(lesson.chapterId);
  const prev = previousLesson(chapters, lesson.id);
  const next = followingLesson(chapters, lesson.id);
  const isCompleted = completedLessonIds.includes(lesson.id);
  const isBookmarked = bookmarkedLessonIds.includes(lesson.id);
  const hasFullContent = !lesson.comingSoon && lesson.steps.length > 0;
  const currentStep: Lesson['steps'][number] | undefined = hasFullContent
    ? lesson.steps[step]
    : undefined;

  return (
    <div className="mx-auto flex w-full max-w-6xl gap-8 px-4 py-8 sm:px-6">
      <div className="hidden lg:block">
        <CourseSidebar activeLessonId={lesson.id} />
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <article className="min-w-0 flex-1">
        {/* Lesson header */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open course menu"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-[1.5px] border-line bg-surface text-ink lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
          <nav aria-label="Breadcrumb" className="min-w-0 font-display text-xs font-bold text-muted sm:text-sm">
            <Link href="/learn" className="hover:text-ink hover:underline">
              {chapter ? chapter.title : 'Learn'}
            </Link>
            <span aria-hidden> / </span>
            <span className="text-ink">
              Lesson {lesson.number} of {TOTAL_LESSONS}
            </span>
          </nav>
        </div>

        <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-4xl">{lesson.title}</h1>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone={difficultyTone(lesson.difficulty)}>{lesson.difficulty}</Badge>
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <Clock className="h-4 w-4" aria-hidden />
            {lesson.durationMin} min
          </span>
          {hasFullContent ? (
            <span className="text-sm text-muted">{lesson.steps.length} steps</span>
          ) : null}
          {lesson.comingSoon ? <Badge>Coming soon</Badge> : null}
          {isCompleted ? (
            <Badge tone="leaf">
              <Check className="mr-1 h-3 w-3" aria-hidden /> Completed
            </Badge>
          ) : null}
        </div>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
          {lesson.intro}
        </p>

        {/* Objectives */}
        {lesson.objectives.length > 0 ? (
          <section aria-label="What you will learn" className="mt-8">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Target className="h-5 w-5 text-muted" aria-hidden />
              What you will learn
            </h2>
            <ul className="mt-3 space-y-2">
              {lesson.objectives.map((objective) => (
                <li key={objective} className="flex items-start gap-2 text-sm leading-relaxed sm:text-base">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-healthy" aria-hidden />
                  {objective}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {hasFullContent && currentStep ? (
          <>
            {/* Simulation — the player renders the current step's
                metric strip, diagram, and playback controls. */}
            <section aria-label="Simulation" className="mt-8">
              <SimulationPlayer lesson={lesson} />
            </section>

            {/* Step navigator */}
            <section aria-label="Lesson steps" className="mt-8">
              <h2 className="text-lg font-bold">Steps</h2>
              <ol className="mt-3 space-y-2">
                {lesson.steps.map((stepItem, index) => {
                  const active = index === step;
                  return (
                    <li key={stepItem.id}>
                      <button
                        type="button"
                        onClick={() => goToStep(index)}
                        aria-current={active ? 'step' : undefined}
                        className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] px-4 py-3 text-left transition-colors ${
                          active
                            ? 'border-ink bg-leaf shadow-offset'
                            : 'border-line bg-surface hover:border-ink'
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line bg-raised font-mono text-xs font-bold">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold sm:text-base">
                          {stepItem.title}
                        </span>
                        {active ? (
                          <span className="shrink-0 font-display text-xs font-bold text-muted">
                            Current step
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ol>
              <div className="mt-3 flex gap-3">
                <Button variant="secondary" onClick={prevStep} disabled={step === 0}>
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                  Previous step
                </Button>
                <Button
                  variant="secondary"
                  onClick={nextStep}
                  disabled={step === lesson.steps.length - 1}
                >
                  Next step
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </section>

            {/* Explanation blocks for the current step */}
            <section aria-label="Explanation" className="mt-8 space-y-6">
              <div>
                <h2 className="text-xl font-bold">{currentStep.title}</h2>
                <p className="mt-2 leading-relaxed text-ink">{currentStep.explanation}</p>
              </div>

              {currentStep.changed.length > 0 ? (
                <Card className="p-5">
                  <h3 className="font-bold">What changed</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted sm:text-base">
                    {currentStep.changed.map((change) => (
                      <li key={change}>{change}</li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {currentStep.goodToKnow ? (
                <Card className="p-5">
                  <h3 className="flex items-center gap-2 font-bold">
                    <Lightbulb className="h-5 w-5 text-muted" aria-hidden />
                    Good to know
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {currentStep.goodToKnow}
                  </p>
                </Card>
              ) : null}

              <Card className="border-ink bg-leaf/40 p-5">
                <h3 className="font-bold">Takeaway</h3>
                <p className="mt-2 text-sm leading-relaxed sm:text-base">{currentStep.takeaway}</p>
              </Card>
            </section>

            {/* Formulas */}
            {lesson.formulas && lesson.formulas.length > 0 ? (
              <section aria-label="Formulas" className="mt-8">
                <h2 className="text-lg font-bold">Formulas</h2>
                <div className="mt-3 space-y-3">
                  {lesson.formulas.map((formula) => (
                    <Card key={formula.name} className="p-4">
                      <p className="font-bold">{formula.name}</p>
                      <p className="mt-1 overflow-x-auto font-mono text-sm">{formula.expression}</p>
                      <p className="mt-1 text-sm text-muted">{formula.note}</p>
                    </Card>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Summary */}
            {lesson.summary ? (
              <section aria-label="Summary" className="mt-8">
                <h2 className="text-lg font-bold">Summary</h2>
                <p className="mt-2 leading-relaxed text-muted">{lesson.summary}</p>
              </section>
            ) : null}
          </>
        ) : (
          /* Coming soon: intro and objectives only, never a fake simulation. */
          <Card className="mt-8 border-ink bg-leaf/40 p-5 sm:p-6">
            <h2 className="text-lg font-bold">This lesson is coming soon</h2>
            <p className="mt-2 text-sm leading-relaxed sm:text-base">
              The full lesson — steps, simulation, and worked examples — is
              still being written. The introduction and objectives above are
              the real outline; check back soon for the finished version.
            </p>
            <div className="mt-4">
              <Button href="/learn" variant="secondary">
                Browse the curriculum
              </Button>
            </div>
          </Card>
        )}

        {/* Mark complete + bookmark */}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button
            onClick={() =>
              isCompleted ? uncompleteLesson(lesson.id) : completeLesson(lesson.id)
            }
          >
            <Check className="h-4 w-4" aria-hidden />
            {isCompleted ? 'Completed — undo' : 'Mark complete'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => toggleBookmark(lesson.id)}
            aria-pressed={isBookmarked}
          >
            <Bookmark
              className="h-4 w-4"
              fill={isBookmarked ? 'currentColor' : 'none'}
              aria-hidden
            />
            {isBookmarked ? 'Bookmarked' : 'Bookmark'}
          </Button>
        </div>

        {/* Prev / next lesson */}
        <nav aria-label="More lessons" className="mt-10 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              href={`/learn/${prev.id}`}
              className="rounded-xl border-[1.5px] border-line bg-surface p-4 hover:border-ink"
            >
              <span className="flex items-center gap-1 font-display text-xs font-bold uppercase tracking-wide text-muted">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Previous lesson
              </span>
              <span className="mt-1 block font-bold">
                Lesson {prev.number}: {prev.title}
              </span>
            </Link>
          ) : (
            <span className="rounded-xl border-[1.5px] border-line bg-raised p-4 text-sm text-muted">
              This is the first lesson.
            </span>
          )}
          {next ? (
            <Link
              href={`/learn/${next.id}`}
              className="rounded-xl border-[1.5px] border-line bg-surface p-4 text-right hover:border-ink"
            >
              <span className="flex items-center justify-end gap-1 font-display text-xs font-bold uppercase tracking-wide text-muted">
                Next lesson
                <ArrowRight className="h-4 w-4" aria-hidden />
              </span>
              <span className="mt-1 block font-bold">
                Lesson {next.number}: {next.title}
              </span>
            </Link>
          ) : (
            <span className="rounded-xl border-[1.5px] border-line bg-raised p-4 text-right text-sm text-muted">
              This is the last lesson.
            </span>
          )}
        </nav>
      </article>
    </div>
  );
}
