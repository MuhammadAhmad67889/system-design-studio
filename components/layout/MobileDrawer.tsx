'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Check, ChevronRight, X } from 'lucide-react';
import { chapters, TOTAL_LESSONS } from '@/lib/content';
import { useProgressStore } from '@/store/progress-store';
import { SearchBox } from '@/components/ui/SearchBox';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { percentComplete } from '@/lib/progress';
import type { ChapterColor } from '@/lib/types';

const NAV_LINKS = [
  { href: '/learn', label: 'Learn' },
  { href: '/practice', label: 'Practice' },
  { href: '/design-lab', label: 'Design Lab' },
  { href: '/cheatsheets', label: 'Cheatsheets' },
];

export const chapterColorClass: Record<ChapterColor, string> = {
  leaf: 'bg-leaf',
  amber: 'bg-amber',
  sky: 'bg-sky',
  lilac: 'bg-lilac',
};

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

/*
 * Slide-out drawer for small screens: nav links, the full chapter
 * tree, and a progress summary. Width is capped well under 360px
 * (85vw, max 320px) so it can never push the page sideways.
 */
export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname();
  const completedLessonIds = useProgressStore((state) => state.completedLessonIds);
  const completedCount = completedLessonIds.length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/40"
      />
      <div className="absolute inset-y-0 left-0 flex w-[85vw] max-w-[320px] flex-col overflow-y-auto border-r-[1.5px] border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="font-display text-sm font-bold">
            SYSTEM DESIGN <span className="rounded bg-leaf px-1 py-0.5 text-xs">Studio</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-raised text-ink"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="border-b border-line px-4 py-3">
          <SearchBox />
        </div>

        <nav aria-label="Mobile" className="border-b border-line px-2 py-2">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center justify-between rounded-lg px-3 py-2.5 font-display text-sm font-bold ${
                  active ? 'bg-leaf text-ink' : 'text-ink hover:bg-raised'
                }`}
              >
                {link.label}
                <ChevronRight className="h-4 w-4 text-muted" aria-hidden />
              </Link>
            );
          })}
        </nav>

        <div className="border-b border-line px-4 py-3">
          <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
            Your progress
          </p>
          <p className="mt-1 font-mono text-sm text-ink">
            {completedCount} of {TOTAL_LESSONS} lessons complete
          </p>
          <div className="mt-2">
            <ProgressBar
              value={percentComplete(completedCount, TOTAL_LESSONS)}
              label="Overall lesson progress"
            />
          </div>
        </div>

        <div className="flex-1 px-2 py-2">
          <p className="px-3 pb-1 pt-2 font-display text-xs font-bold uppercase tracking-wide text-muted">
            Chapters
          </p>
          {chapters.map((chapter) => (
            <details key={chapter.id} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-2 font-display text-sm font-bold text-ink hover:bg-raised">
                <span
                  className={`h-3 w-3 shrink-0 rounded-sm border border-line ${chapterColorClass[chapter.color]}`}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">
                  {chapter.number}. {chapter.title}
                </span>
                <span className="font-mono text-xs font-normal text-muted">
                  {chapter.lessons.filter((l) => completedLessonIds.includes(l.id)).length}/
                  {chapter.lessons.length}
                </span>
              </summary>
              <ul className="pb-1 pl-8">
                {chapter.lessons.map((lesson) => {
                  const done = completedLessonIds.includes(lesson.id);
                  const active = pathname === `/learn/${lesson.id}`;
                  return (
                    <li key={lesson.id}>
                      <Link
                        href={`/learn/${lesson.id}`}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                          active ? 'bg-leaf font-bold text-ink' : 'text-muted hover:text-ink'
                        }`}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-healthy" aria-label="Completed" />
                        ) : (
                          <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {lesson.number}. {lesson.title}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
