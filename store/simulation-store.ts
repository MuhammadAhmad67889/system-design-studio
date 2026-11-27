/*
 * Simulation playback store (Zustand, not persisted).
 * One lesson's simulation owns one instance of this state:
 * the current step, whether it is playing, and the playback speed.
 * Step changes are the single source of truth — the diagram, the
 * metrics and the explanation all read the same step index.
 */

import { create } from 'zustand';
import { clampStep, nextStepIndex, prevStepIndex } from '@/lib/progress';

interface SimulationState {
  step: number;
  stepCount: number;
  playing: boolean;
  speed: number;
  init: (stepCount: number) => void;
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  restart: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
}

export const useSimulationStore = create<SimulationState>()((set) => ({
  step: 0,
  stepCount: 1,
  playing: false,
  speed: 1,
  init: (stepCount) => set({ stepCount: Math.max(1, stepCount), step: 0, playing: false }),
  goToStep: (step) => set((state) => ({ step: clampStep(step, state.stepCount), playing: false })),
  nextStep: () => set((state) => ({ step: nextStepIndex(state.step, state.stepCount) })),
  prevStep: () => set((state) => ({ step: prevStepIndex(state.step, state.stepCount) })),
  restart: () => set({ step: 0, playing: false }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  setSpeed: (speed) => set({ speed: Math.min(Math.max(speed, 0.5), 3) }),
}));
