import type { ReactNode } from 'react';
import type { Difficulty } from '@/lib/types';

export type BadgeTone = 'leaf' | 'amber' | 'sky' | 'lilac' | 'muted';

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}

const toneClasses: Record<BadgeTone, string> = {
  leaf: 'bg-leaf text-ink',
  amber: 'bg-amber text-ink',
  sky: 'bg-sky text-ink',
  lilac: 'bg-lilac text-ink',
  muted: 'bg-raised text-muted',
};

/* Small pill label for difficulty, category, or status. */
export function Badge({ children, tone = 'muted', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line px-2.5 py-0.5 font-display text-xs font-bold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* Difficulty always gets the same color, wherever it appears. */
export function difficultyTone(difficulty: Difficulty): BadgeTone {
  if (difficulty === 'Beginner') return 'leaf';
  if (difficulty === 'Intermediate') return 'sky';
  return 'lilac';
}
