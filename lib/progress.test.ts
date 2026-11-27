import { describe, expect, it } from 'vitest';
import {
  percentComplete,
  nextLesson,
  followingLesson,
  previousLesson,
  clampStep,
  nextStepIndex,
  prevStepIndex,
  littlesLaw,
  utilization,
  calculateCapacity,
} from '@/lib/progress';
import type { Chapter } from '@/lib/types';

function makeChapters(): Chapter[] {
  const lesson = (id: string, chapterId: string, number: number) => ({
    id,
    chapterId,
    number,
    title: id,
    durationMin: 10,
    difficulty: 'Beginner' as const,
    intro: '',
    objectives: [],
    steps: [],
    summary: '',
  });
  return [
    {
      id: 'c1',
      number: 1,
      title: 'One',
      tagline: '',
      color: 'leaf' as const,
      lessons: [lesson('l1', 'c1', 1), lesson('l2', 'c1', 2)],
    },
    {
      id: 'c2',
      number: 2,
      title: 'Two',
      tagline: '',
      color: 'amber' as const,
      lessons: [lesson('l3', 'c2', 3)],
    },
  ];
}

describe('percentComplete', () => {
  it('returns 0 with no total', () => {
    expect(percentComplete(0, 0)).toBe(0);
  });

  it('computes a whole-number percent', () => {
    expect(percentComplete(12, 40)).toBe(30);
    expect(percentComplete(1, 3)).toBe(33);
  });

  it('clamps above 100 and below 0', () => {
    expect(percentComplete(50, 40)).toBe(100);
    expect(percentComplete(-2, 40)).toBe(0);
  });
});

describe('lesson navigation', () => {
  const chapters = makeChapters();

  it('nextLesson returns the first unfinished lesson', () => {
    expect(nextLesson(chapters, new Set(['l1']))?.id).toBe('l2');
    expect(nextLesson(chapters, new Set())?.id).toBe('l1');
    expect(nextLesson(chapters, new Set(['l1', 'l2', 'l3']))).toBeNull();
  });

  it('followingLesson and previousLesson walk in order', () => {
    expect(followingLesson(chapters, 'l1')?.id).toBe('l2');
    expect(followingLesson(chapters, 'l2')?.id).toBe('l3');
    expect(followingLesson(chapters, 'l3')).toBeNull();
    expect(previousLesson(chapters, 'l2')?.id).toBe('l1');
    expect(previousLesson(chapters, 'l1')).toBeNull();
  });
});

describe('step helpers', () => {
  it('clamps steps into range', () => {
    expect(clampStep(-1, 5)).toBe(0);
    expect(clampStep(9, 5)).toBe(4);
    expect(clampStep(2, 5)).toBe(2);
    expect(clampStep(0, 0)).toBe(0);
  });

  it('next/prev step stay at the ends', () => {
    expect(nextStepIndex(4, 5)).toBe(4);
    expect(nextStepIndex(2, 5)).toBe(3);
    expect(prevStepIndex(0, 5)).toBe(0);
    expect(prevStepIndex(2, 5)).toBe(1);
  });
});

describe("Little's Law", () => {
  it('L = λW', () => {
    // 100 requests/sec arriving, each spending 0.2s in the system: 20 in flight.
    expect(littlesLaw(100, 0.2)).toBeCloseTo(20);
  });

  it('returns 0 for negative inputs', () => {
    expect(littlesLaw(-5, 1)).toBe(0);
    expect(littlesLaw(5, -1)).toBe(0);
  });
});

describe('utilization', () => {
  it('is arrival rate times service time', () => {
    expect(utilization(50, 0.01)).toBeCloseTo(0.5);
  });

  it('reaches 1 at saturation', () => {
    expect(utilization(100, 0.01)).toBeCloseTo(1);
  });
});

describe('calculateCapacity', () => {
  const input = {
    dailyActiveUsers: 1_000_000,
    requestsPerUserPerDay: 20,
    peakMultiplier: 3,
    avgPayloadKb: 2,
    readWriteRatio: 9,
    storagePerUserMb: 10,
    retentionDays: 365,
    serverCapacityRps: 1000,
  };

  it('computes requests, RPS and servers', () => {
    const out = calculateCapacity(input);
    expect(out.requestsPerDay).toBe(20_000_000);
    expect(out.avgRps).toBeCloseTo(231.48, 1);
    expect(out.peakRps).toBeCloseTo(694.44, 1);
    expect(out.serversNeeded).toBe(1);
  });

  it('splits reads and writes by ratio', () => {
    const out = calculateCapacity(input);
    // 9:1 means 90% reads at peak.
    expect(out.readRps).toBeCloseTo(out.peakRps * 0.9, 6);
    expect(out.writeRps).toBeCloseTo(out.peakRps * 0.1, 6);
  });

  it('scales storage with users and retention', () => {
    const out = calculateCapacity(input);
    expect(out.storageGb).toBeCloseTo((1_000_000 * 10 * 365) / 1024, 0);
  });

  it('never returns zero servers', () => {
    const out = calculateCapacity({ ...input, dailyActiveUsers: 10 });
    expect(out.serversNeeded).toBeGreaterThanOrEqual(1);
  });
});
