'use client';

/*
 * PlaybackControls: the transport buttons for a simulation.
 * One row of icon buttons with text labels for screen readers.
 * Previous and Next disable at the ends of the lesson.
 */

import { ChevronLeft, ChevronRight, Maximize, Pause, Play, RotateCcw } from 'lucide-react';

interface PlaybackControlsProps {
  playing: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPlay: () => void;
  onPause: () => void;
  onRestart: () => void;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen: () => void;
}

const BUTTON_CLASS =
  'inline-flex items-center justify-center rounded-lg border border-line bg-surface p-2 text-ink shadow-offset transition-colors hover:bg-leaf disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none';

export function PlaybackControls({
  playing,
  isFirstStep,
  isLastStep,
  onPlay,
  onPause,
  onRestart,
  onPrev,
  onNext,
  onFullscreen,
}: PlaybackControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Simulation playback">
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={playing ? onPause : onPlay}
        aria-label={playing ? 'Pause simulation' : 'Play simulation'}
      >
        {playing ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={onRestart} aria-label="Restart simulation">
        <RotateCcw size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={onPrev}
        disabled={isFirstStep}
        aria-label="Previous step"
      >
        <ChevronLeft size={18} aria-hidden="true" />
      </button>
      <button
        type="button"
        className={BUTTON_CLASS}
        onClick={onNext}
        disabled={isLastStep}
        aria-label="Next step"
      >
        <ChevronRight size={18} aria-hidden="true" />
      </button>
      <button type="button" className={BUTTON_CLASS} onClick={onFullscreen} aria-label="View fullscreen">
        <Maximize size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
