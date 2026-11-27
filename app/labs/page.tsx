'use client';

import Link from 'next/link';
import { Check, Clock } from 'lucide-react';
import { getChapter } from '@/lib/content';
import { allLabs, TOTAL_LABS } from '@/lib/labs';
import { percentComplete } from '@/lib/progress';
import { useProgressStore } from '@/store/progress-store';
import { Badge, difficultyTone } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { chapterColorClass } from '@/components/layout/MobileDrawer';

export default function LabsPage() {
  const labProgress = useProgressStore((state) => state.labProgress);

  const completedCount = allLabs.filter(
    (lab) => labProgress[lab.id]?.completed,
  ).length;
  const percent = percentComplete(completedCount, TOTAL_LABS);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Labs
        </p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Hands-on labs</h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-muted">
          Nine guided exercises, one per chapter. Build the system on the
          canvas, step by step, and check your work as you go.
        </p>
      </header>

      <Card className="mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-display text-sm font-bold">Overall progress</p>
          <p className="font-mono text-sm text-muted">
            {completedCount} of {TOTAL_LABS} labs · {percent}%
          </p>
        </div>
        <div className="mt-3">
          <ProgressBar value={percent} label="Overall lab progress" />
        </div>
        <p className="mt-3 text-sm text-muted">
          {completedCount === TOTAL_LABS
            ? 'All 9 labs complete — well done.'
            : 'A lab counts as done when every check on its canvas passes and you mark it complete.'}
        </p>
      </Card>

      <ul className="mt-8 space-y-4">
        {allLabs.map((lab) => {
          const chapter = getChapter(lab.chapterId);
          const entry = labProgress[lab.id];
          const done = entry?.completed ?? false;
          const started =
            (entry?.doneSteps.length ?? 0) > 0 ||
            (entry?.doneSelfChecks.length ?? 0) > 0;
          const status = done ? 'Done' : started ? 'In progress' : 'Not started';

          return (
            <li key={lab.id}>
              <Link href={`/labs/${lab.id}`} className="group block">
                <Card className="p-5 transition-shadow group-hover:shadow-offset sm:p-6">
                  <div className="flex items-start gap-3">
                    {chapter ? (
                      <span
                        className={`mt-1 h-5 w-5 shrink-0 rounded-sm border border-line ${chapterColorClass[chapter.color]}`}
                        aria-hidden
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-muted">
                        {chapter
                          ? `Chapter ${chapter.number}: ${chapter.title}`
                          : `Lab ${lab.number}`}
                        {' · '}
                        <span className="font-bold text-ink">{status}</span>
                      </p>
                      <h2 className="mt-1 text-lg font-bold leading-snug sm:text-xl">
                        Lab {lab.number}: {lab.title}
                      </h2>
                      <p className="mt-1 text-sm leading-relaxed text-muted sm:text-base">
                        {lab.goal}
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Badge tone={difficultyTone(lab.difficulty)}>
                          {lab.difficulty}
                        </Badge>
                        <span className="inline-flex items-center gap-1 text-sm text-muted">
                          <Clock className="h-4 w-4" aria-hidden />
                          {lab.estMin} min
                        </span>
                        {done ? (
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-healthy">
                            <Check className="h-4 w-4" aria-hidden />
                            Complete
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
