'use client';

/*
 * SimulationPlayer owns playback for one lesson's simulation.
 *
 * All playback state lives in useSimulationStore, so the diagram,
 * the metrics and the explanation all follow the same step index.
 * While playing, a timer advances one step every 2600ms divided by
 * the speed, until the last step, where playback stops.
 *
 * The "Reduce motion" toggle stops auto-play and adds the .sim-paused
 * class, which freezes the CSS animations in globals.css. Fullscreen
 * uses the browser's native requestFullscreen; Escape exits it.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { Lesson } from '@/lib/types';
import { useSimulationStore } from '@/store/simulation-store';
import { DiagramCanvas } from '@/components/simulation/DiagramCanvas';
import { MetricStrip } from '@/components/simulation/MetricStrip';
import { PlaybackControls } from '@/components/simulation/PlaybackControls';

const STEP_DURATION_MS = 2600;
const SPEEDS = [0.5, 1, 2];

/**
 * Reads the system reduced-motion setting and stays in sync with it.
 * useSyncExternalStore (with a false server snapshot) is the safe way
 * to read matchMedia: it never sets state inside an effect, and it
 * cannot disagree with the server render during hydration.
 */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia('(prefers-reduced-motion: reduce)');
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

export function SimulationPlayer({ lesson }: { lesson: Lesson }) {
  const step = useSimulationStore((state) => state.step);
  const stepCount = useSimulationStore((state) => state.stepCount);
  const playing = useSimulationStore((state) => state.playing);
  const speed = useSimulationStore((state) => state.speed);
  const init = useSimulationStore((state) => state.init);
  const goToStep = useSimulationStore((state) => state.goToStep);
  const nextStep = useSimulationStore((state) => state.nextStep);
  const prevStep = useSimulationStore((state) => state.prevStep);
  const restart = useSimulationStore((state) => state.restart);
  const play = useSimulationStore((state) => state.play);
  const pause = useSimulationStore((state) => state.pause);
  const setSpeed = useSimulationStore((state) => state.setSpeed);

  const panelRef = useRef<HTMLDivElement | null>(null);
  // The toggle is the learner's own choice; the system setting is read
  // separately, and either one is enough to stop the motion.
  const [motionReducedByChoice, setMotionReducedByChoice] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const reduceMotion = motionReducedByChoice || prefersReducedMotion;

  // Start from the lesson's own step count whenever the lesson changes.
  useEffect(() => {
    init(lesson.steps.length);
  }, [lesson.id, lesson.steps.length, init]);

  const isLastStep = step >= stepCount - 1;

  // Stop on the last step instead of looping.
  useEffect(() => {
    if (playing && isLastStep) pause();
  }, [playing, isLastStep, pause]);

  // Advance one step per interval while playing. The timer restarts
  // whenever the step or speed changes, so each step gets its full time.
  useEffect(() => {
    if (!playing || reduceMotion || isLastStep) return undefined;
    const timer = window.setTimeout(nextStep, STEP_DURATION_MS / speed);
    return () => window.clearTimeout(timer);
  }, [playing, reduceMotion, isLastStep, step, speed, nextStep]);

  const handleFullscreen = useCallback(() => {
    panelRef.current?.requestFullscreen?.();
  }, []);

  const handleReduceMotion = useCallback(() => {
    setMotionReducedByChoice((current) => {
      const next = !current;
      if (next) pause();
      return next;
    });
  }, [pause]);

  if (lesson.steps.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <p className="text-sm text-muted">
          The simulation for “{lesson.title}” is coming soon.
        </p>
      </div>
    );
  }

  const currentStep = lesson.steps[Math.min(step, lesson.steps.length - 1)];
  const paused = !playing || reduceMotion;

  return (
    <div
      ref={panelRef}
      className={`rounded-xl border border-line bg-surface p-4 shadow-offset sm:p-6 ${paused ? 'sim-paused' : ''}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">{currentStep.title}</h2>
        <p className="font-mono text-sm text-muted" aria-live="polite">
          Step {step + 1} of {stepCount}
        </p>
      </div>

      <div className="mt-4">
        <DiagramCanvas diagram={currentStep.diagram} playing={playing && !reduceMotion} />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <PlaybackControls
          playing={playing}
          isFirstStep={step === 0}
          isLastStep={isLastStep}
          onPlay={play}
          onPause={pause}
          onRestart={restart}
          onPrev={prevStep}
          onNext={nextStep}
          onFullscreen={handleFullscreen}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted" htmlFor="sim-speed">
            Speed
            <select
              id="sim-speed"
              value={speed}
              onChange={(event) => setSpeed(Number(event.target.value))}
              className="rounded-lg border border-line bg-surface px-2 py-1 font-mono text-sm text-ink"
            >
              {SPEEDS.map((option) => (
                <option key={option} value={option}>
                  {option}x
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={handleReduceMotion}
            aria-pressed={reduceMotion}
            className={`rounded-lg border px-3 py-1.5 text-sm font-bold ${
              reduceMotion ? 'border-line bg-leaf text-ink' : 'border-line bg-surface text-ink'
            }`}
          >
            Reduce motion
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Steps">
        {lesson.steps.map((stepItem, index) => (
          <button
            key={stepItem.id}
            type="button"
            onClick={() => goToStep(index)}
            aria-label={`Go to step ${index + 1}: ${stepItem.title}`}
            aria-current={index === step ? 'step' : undefined}
            className={`h-3 w-8 rounded-full border border-line ${
              index === step ? 'bg-amber' : index < step ? 'bg-leaf' : 'bg-raised'
            }`}
          />
        ))}
      </div>

      <div className="mt-4">
        <MetricStrip metrics={currentStep.metrics} />
      </div>

      <div className="mt-6 space-y-4">
        <p className="text-base leading-relaxed text-ink">{currentStep.explanation}</p>
        {currentStep.changed.length > 0 ? (
          <section aria-label="What changed">
            <h3 className="font-display text-sm font-bold text-ink">What changed</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
              {currentStep.changed.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}
        {currentStep.goodToKnow ? (
          <section aria-label="Good to know">
            <h3 className="font-display text-sm font-bold text-ink">Good to know</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{currentStep.goodToKnow}</p>
          </section>
        ) : null}
        <p className="rounded-lg border border-line bg-leaf p-3 text-sm font-bold text-ink">
          Takeaway: {currentStep.takeaway}
        </p>
      </div>
    </div>
  );
}
