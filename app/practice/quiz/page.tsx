'use client';

/*
 * Quiz runner: one question at a time, hint on request, feedback after
 * each submit, and a results screen with a per-question review.
 * The best score is saved through the progress store so the Practice
 * landing can show it next time.
 */

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CircleCheck,
  CircleX,
  Clock,
  Lightbulb,
  RotateCcw,
  Target,
} from 'lucide-react';
import { quizQuestions } from '@/lib/content';
import { useProgressStore } from '@/store/progress-store';
import type { QuizQuestion } from '@/lib/types';

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function difficultyTone(difficulty: QuizQuestion['difficulty']): string {
  if (difficulty === 'Beginner') return 'bg-leaf text-ink';
  if (difficulty === 'Intermediate') return 'bg-amber text-ink';
  return 'bg-lilac text-ink';
}

function QuizRunner() {
  const searchParams = useSearchParams();
  const topic = searchParams.get('topic');
  const recordQuizScore = useProgressStore((state) => state.recordQuizScore);

  const questions = useMemo(() => {
    if (!topic) return quizQuestions;
    return quizQuestions.filter((q) => q.topic === topic);
  }, [topic]);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [hintShown, setHintShown] = useState(false);
  const [correctFlags, setCorrectFlags] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // The clock starts in an effect, not during render: Date.now() is
  // impure, and render must stay pure.
  const startedAtRef = useRef<number>(0);
  const scoreRecordedRef = useRef(false);

  const question = questions[index];
  const total = questions.length;
  const correctCount = correctFlags.filter(Boolean).length;

  // (Re)start the clock whenever the question set changes (new topic / retry).
  useEffect(() => {
    startedAtRef.current = Date.now();
    scoreRecordedRef.current = false;
  }, [topic, total]);

  function handleSubmit() {
    if (selected === null || !question) return;
    setSubmitted(true);
    setCorrectFlags((flags) => [...flags, selected === question.answerIndex]);
  }

  function handleNext() {
    if (index + 1 >= total) {
      setElapsedSeconds(Math.round((Date.now() - startedAtRef.current) / 1000));
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setSelected(null);
    setSubmitted(false);
    setHintShown(false);
  }

  function handleRetry() {
    setIndex(0);
    setSelected(null);
    setSubmitted(false);
    setHintShown(false);
    setCorrectFlags([]);
    setFinished(false);
    setElapsedSeconds(0);
    startedAtRef.current = Date.now();
    scoreRecordedRef.current = false;
  }

  // Save the best score once, when the results screen first appears.
  useEffect(() => {
    if (finished && !scoreRecordedRef.current) {
      scoreRecordedRef.current = true;
      recordQuizScore(`quiz-${topic ?? 'all'}`, correctCount);
    }
  }, [finished, correctCount, recordQuizScore, topic]);

  if (questions.length === 0) {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold">No questions here yet</h1>
        <p className="mt-3 text-muted">
          {topic
            ? `There are no questions for “${topic}” yet — the bank is still being written.`
            : 'Questions are being written — check back soon.'}
        </p>
        <Link
          href="/practice"
          className="mt-6 inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-4 py-2 font-display text-sm font-bold shadow-offset"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to Practice
        </Link>
      </main>
    );
  }

  if (finished) {
    const accuracy = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
        <p className="font-display text-sm text-muted">
          {topic ? `Quiz: ${topic}` : 'Quiz: all topics'}
        </p>
        <h1 className="mt-2 text-3xl font-bold">Your results</h1>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border-2 border-line bg-surface p-4 shadow-offset">
            <p className="flex items-center gap-1.5 font-display text-sm text-muted">
              <Target className="h-4 w-4" aria-hidden /> Score
            </p>
            <p className="mt-1 text-2xl font-bold">
              {correctCount} / {total}
            </p>
          </div>
          <div className="rounded-lg border-2 border-line bg-surface p-4 shadow-offset">
            <p className="flex items-center gap-1.5 font-display text-sm text-muted">
              <CircleCheck className="h-4 w-4" aria-hidden /> Accuracy
            </p>
            <p className="mt-1 text-2xl font-bold">{accuracy}%</p>
          </div>
          <div className="rounded-lg border-2 border-line bg-surface p-4 shadow-offset">
            <p className="flex items-center gap-1.5 font-display text-sm text-muted">
              <Clock className="h-4 w-4" aria-hidden /> Time spent
            </p>
            <p className="mt-1 text-2xl font-bold">{formatElapsed(elapsedSeconds)}</p>
          </div>
        </div>

        <h2 className="mt-10 text-xl font-bold">Review your answers</h2>
        <ol className="mt-4 space-y-4">
          {questions.map((q, i) => {
            const wasCorrect = correctFlags[i] ?? false;
            return (
              <li
                key={q.id}
                className="rounded-lg border-2 border-line bg-surface p-4 shadow-offset"
              >
                <p className="flex items-start gap-2 font-bold">
                  {wasCorrect ? (
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-healthy" aria-hidden />
                  ) : (
                    <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden />
                  )}
                  <span>
                    {i + 1}. {q.question}
                  </span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  {wasCorrect
                    ? `Correct — ${q.options[q.answerIndex]}`
                    : `Correct answer: ${q.options[q.answerIndex]}`}
                </p>
                <p className="mt-2 text-sm">{q.explanation}</p>
                {q.lessonId && (
                  <Link
                    href={`/learn/${q.lessonId}`}
                    className="mt-3 inline-flex items-center gap-1.5 font-display text-sm font-bold underline"
                  >
                    <BookOpen className="h-4 w-4" aria-hidden />
                    Review the lesson
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-4 py-2 font-display text-sm font-bold shadow-offset"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Retry
          </button>
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 rounded-md border-2 border-line bg-surface px-4 py-2 font-display text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Practice
          </Link>
        </div>
      </main>
    );
  }

  if (!question) return null;

  const isCorrect = submitted && selected === question.answerIndex;

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/practice"
        className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All practice
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="font-display text-sm" aria-live="polite">
          Question {index + 1} of {total}
        </p>
        <div className="flex gap-1.5">
          <span className="rounded-full bg-sky px-2.5 py-0.5 font-display text-xs font-bold">
            {question.topic}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-display text-xs font-bold ${difficultyTone(question.difficulty)}`}
          >
            {question.difficulty}
          </span>
        </div>
      </div>

      <div
        className="mt-3 h-2 overflow-hidden rounded-full border border-line bg-surface"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Question ${index + 1} of ${total}`}
      >
        <div
          className="h-full bg-leaf-deep transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <fieldset className="mt-8" disabled={submitted}>
        <legend className="text-xl font-bold leading-snug">{question.question}</legend>
        <div className="mt-5 space-y-3">
          {question.options.map((option, optionIndex) => {
            const inputId = `q-${question.id}-opt-${optionIndex}`;
            const isChosen = selected === optionIndex;
            const isAnswer = optionIndex === question.answerIndex;
            let optionClass =
              'flex cursor-pointer items-start gap-3 rounded-lg border-2 border-line bg-surface p-4 hover:border-ink';
            if (submitted && isAnswer) {
              optionClass =
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 border-ink bg-leaf p-4';
            } else if (submitted && isChosen) {
              optionClass =
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 border-ink bg-lilac p-4';
            } else if (isChosen) {
              optionClass =
                'flex cursor-pointer items-start gap-3 rounded-lg border-2 border-ink bg-sky p-4';
            }
            return (
              <label key={inputId} htmlFor={inputId} className={optionClass}>
                <input
                  id={inputId}
                  type="radio"
                  name={`q-${question.id}`}
                  value={optionIndex}
                  checked={isChosen}
                  onChange={() => setSelected(optionIndex)}
                  className="mt-1 h-4 w-4 shrink-0 accent-ink"
                />
                <span className="flex-1">{option}</span>
                {submitted && isAnswer && (
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" aria-label="Correct answer" />
                )}
                {submitted && isChosen && !isAnswer && (
                  <CircleX className="mt-0.5 h-5 w-5 shrink-0" aria-label="Your answer" />
                )}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setHintShown((shown) => !shown)}
          aria-expanded={hintShown}
          className="inline-flex items-center gap-2 rounded-md border-2 border-line bg-surface px-4 py-2 font-display text-sm font-bold"
        >
          <Lightbulb className="h-4 w-4" aria-hidden />
          {hintShown ? 'Hide hint' : 'Hint'}
        </button>
        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={selected === null}
            className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-leaf px-4 py-2 font-display text-sm font-bold shadow-offset disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit
          </button>
        )}
        {submitted && (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 rounded-md border-2 border-ink bg-amber px-4 py-2 font-display text-sm font-bold shadow-offset"
          >
            {index + 1 >= total ? 'See results' : 'Next question'}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
      </div>

      {hintShown && (
        <p className="mt-4 rounded-lg border-2 border-line bg-sky/40 p-4 text-sm">
          <span className="font-bold">Hint: </span>
          {question.hint}
        </p>
      )}

      {submitted && (
        <div
          className={`mt-4 rounded-lg border-2 p-4 shadow-offset ${
            isCorrect ? 'border-ink bg-leaf' : 'border-ink bg-lilac'
          }`}
          role="status"
        >
          <p className="flex items-center gap-2 font-bold">
            {isCorrect ? (
              <>
                <CircleCheck className="h-5 w-5" aria-hidden />
                Correct — nicely done.
              </>
            ) : (
              <>
                <CircleX className="h-5 w-5" aria-hidden />
                Not quite — the correct answer is “{question.options[question.answerIndex]}”.
              </>
            )}
          </p>
          <p className="mt-2 text-sm leading-relaxed">{question.explanation}</p>
        </div>
      )}
    </main>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
          <p className="text-muted">Loading quiz…</p>
        </main>
      }
    >
      <QuizRunner />
    </Suspense>
  );
}
