import { beforeEach, describe, expect, it } from 'vitest';
import { useSimulationStore } from '@/store/simulation-store';

function resetStore() {
  useSimulationStore.setState({ step: 0, stepCount: 1, playing: false, speed: 1 });
}

describe('useSimulationStore', () => {
  beforeEach(resetStore);

  it('init sets the step count and resets to step 0', () => {
    useSimulationStore.getState().init(5);
    const state = useSimulationStore.getState();
    expect(state.stepCount).toBe(5);
    expect(state.step).toBe(0);
    expect(state.playing).toBe(false);
  });

  it('init never allows a step count below 1', () => {
    useSimulationStore.getState().init(0);
    expect(useSimulationStore.getState().stepCount).toBe(1);
  });

  it('nextStep advances one step at a time', () => {
    const store = useSimulationStore.getState();
    store.init(3);
    useSimulationStore.getState().nextStep();
    expect(useSimulationStore.getState().step).toBe(1);
    useSimulationStore.getState().nextStep();
    expect(useSimulationStore.getState().step).toBe(2);
  });

  it('nextStep stays on the last step instead of overflowing', () => {
    const store = useSimulationStore.getState();
    store.init(3);
    useSimulationStore.getState().goToStep(2);
    useSimulationStore.getState().nextStep();
    expect(useSimulationStore.getState().step).toBe(2);
  });

  it('prevStep moves back one step', () => {
    const store = useSimulationStore.getState();
    store.init(3);
    useSimulationStore.getState().goToStep(2);
    useSimulationStore.getState().prevStep();
    expect(useSimulationStore.getState().step).toBe(1);
  });

  it('prevStep stays on the first step instead of underflowing', () => {
    useSimulationStore.getState().init(3);
    useSimulationStore.getState().prevStep();
    expect(useSimulationStore.getState().step).toBe(0);
  });

  it('restart returns to step 0 and pauses', () => {
    const store = useSimulationStore.getState();
    store.init(4);
    useSimulationStore.getState().goToStep(3);
    useSimulationStore.getState().play();
    useSimulationStore.getState().restart();
    const state = useSimulationStore.getState();
    expect(state.step).toBe(0);
    expect(state.playing).toBe(false);
  });

  it('goToStep jumps to the given step', () => {
    useSimulationStore.getState().init(5);
    useSimulationStore.getState().goToStep(3);
    expect(useSimulationStore.getState().step).toBe(3);
  });

  it('goToStep clamps above the last step and below the first', () => {
    useSimulationStore.getState().init(4);
    useSimulationStore.getState().goToStep(99);
    expect(useSimulationStore.getState().step).toBe(3);
    useSimulationStore.getState().goToStep(-5);
    expect(useSimulationStore.getState().step).toBe(0);
  });

  it('play and pause toggle playback', () => {
    useSimulationStore.getState().play();
    expect(useSimulationStore.getState().playing).toBe(true);
    useSimulationStore.getState().pause();
    expect(useSimulationStore.getState().playing).toBe(false);
  });

  it('setSpeed clamps to 0.5–3', () => {
    useSimulationStore.getState().setSpeed(2);
    expect(useSimulationStore.getState().speed).toBe(2);
    useSimulationStore.getState().setSpeed(10);
    expect(useSimulationStore.getState().speed).toBe(3);
    useSimulationStore.getState().setSpeed(0.1);
    expect(useSimulationStore.getState().speed).toBe(0.5);
  });
});
