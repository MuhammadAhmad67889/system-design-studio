'use client';

/*
 * Practice landing: one card per quiz topic, with a difficulty filter.
 * Topics and counts come from the quiz bank itself, so new questions
 * show up here without touching this page.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Clock, FlaskConical, Target } from 'lucide-react';
import { quizQuestions } from '@/lib/content';
import { useProgressStore } from '@/store/progress-store';
import type { Difficulty, QuizQuestion } from '@/lib/types';

type DifficultyFilter = Difficulty | 'All';

const DIFFICULTIES: DifficultyFilter[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

/** Roughly one minute per question, rounded up. */
function estimateMinutes(count: number): number {
  return Math.max(1, count);
}

function matchesDifficulty(question: QuizQuestion, filter: DifficultyFilter): boolean {
  return filter === 'All' || question.difficulty === filter;
}

function difficultyTone(difficulty: Difficulty): string {
  if (difficulty === 'Beginner') return 'bg-leaf text-ink';
  if (difficulty === 'Intermediate') return 'bg-amber text-ink';
  return 'bg-lilac text-ink';
}

export default function PracticePage() {
  const [filter, setFilter] = useState<DifficultyFilter>('All');
  const quizBest = useProgressStore((state) => state.quizBest);

  const topics = useMemo(() => {
    const grouped = new Map<string, QuizQuestion[]>();
    for (const question of quizQuestions) {
      const list = grouped.get(question.topic) ?? [];
      list.push(question);
      grouped.set(question.topic, list);
    }
    return [...grouped.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const filteredQuestions = quizQuestions.filter((q) => matchesDifficulty(q, filter));
  const filteredTopics = topics
    .map(([topic, questions]) => ({
      topic,
      questions: questions.filter((q) => matchesDifficulty(q, filter)),
    }))
    .filter((entry) => entry.questions.length > 0);

  if (quizQuestions.length === 0) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <p className="font-display text-sm text-muted">Practice</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Practice quizzes</h1>
        <div className="mt-8 rounded-lg border-2 border-line bg-surface p-8 text-center shadow-offset">
          <FlaskConical className="mx-auto h-10 w-10 text-muted" aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Questions are being written — check back soon</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">
            The quiz bank is empty right now. While you wait, the lessons and
            cheatsheets are ready to read.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-4 py-2 font-display text-sm font-bold shadow-offset"
          >
            Back to home
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <p className="font-display text-sm text-muted">Practice</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Practice quizzes</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Short scenario questions drawn from the lessons. Pick a topic, answer
        one question at a time, and read the explanation after each one —
        including why the tempting wrong answer fails.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen className="h-4 w-4" aria-hidden />
          {filteredQuestions.length} question{filteredQuestions.length === 1 ? '' : 's'}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="h-4 w-4" aria-hidden />
          About {estimateMinutes(filteredQuestions.length)} min
        </span>
      </div>

      <div
        className="mt-8 flex flex-wrap gap-2"
        role="group"
        aria-label="Filter by difficulty"
      >
        {DIFFICULTIES.map((difficulty) => (
          <button
            key={difficulty}
            type="button"
            onClick={() => setFilter(difficulty)}
            aria-pressed={filter === difficulty}
            className={
              filter === difficulty
                ? 'rounded-full border-2 border-ink bg-ink px-4 py-1.5 font-display text-sm font-bold text-bg'
                : 'rounded-full border-2 border-line bg-surface px-4 py-1.5 font-display text-sm hover:border-ink'
            }
          >
            {difficulty}
          </button>
        ))}
      </div>

      {filteredTopics.length === 0 ? (
        <p className="mt-10 rounded-lg border-2 border-line bg-surface p-6 text-muted">
          No {filter.toLowerCase()} questions yet. Try another difficulty.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {filteredTopics.map(({ topic, questions }) => {
            const best = quizBest[`quiz-${topic}`];
            const difficulties = [...new Set(questions.map((q) => q.difficulty))];
            return (
              <article
                key={topic}
                className="flex flex-col rounded-lg border-2 border-line bg-surface p-5 shadow-offset"
              >
                <h2 className="text-lg font-bold">{topic}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {difficulties.map((difficulty) => (
                    <span
                      key={difficulty}
                      className={`rounded-full px-2.5 py-0.5 font-display text-xs font-bold ${difficultyTone(difficulty)}`}
                    >
                      {difficulty}
                    </span>
                  ))}
                </div>
                <p className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4" aria-hidden />
                    {questions.length} question{questions.length === 1 ? '' : 's'}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4" aria-hidden />
                    About {estimateMinutes(questions.length)} min
                  </span>
                  {best !== undefined && (
                    <span className="inline-flex items-center gap-1.5">
                      <Target className="h-4 w-4" aria-hidden />
                      Best score: {best} / {questions.length}
                    </span>
                  )}
                </p>
                <Link
                  href={`/practice/quiz?topic=${encodeURIComponent(topic)}`}
                  className="mt-4 inline-flex items-center justify-center gap-2 rounded-md border-2 border-ink bg-leaf px-4 py-2 font-display text-sm font-bold shadow-offset"
                >
                  Start Practice
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </article>
            );
          })}
        </div>
      )}

      <div className="mt-8 rounded-lg border-2 border-line bg-surface p-5">
        <h2 className="font-bold">All topics</h2>
        <p className="mt-1 text-sm text-muted">
          {filteredQuestions.length} questions across {filteredTopics.length} topic
          {filteredTopics.length === 1 ? '' : 's'}, about{' '}
          {estimateMinutes(filteredQuestions.length)} minutes.
        </p>
        <Link
          href="/practice/quiz"
          className="mt-4 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-amber px-4 py-2 font-display text-sm font-bold shadow-offset"
        >
          Start all topics
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </main>
  );
}
