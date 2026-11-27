/*
 * Pure helpers for progress and simulation math.
 * Kept free of React and storage so Vitest can test them directly.
 */

import type { Chapter, Lesson } from '@/lib/types';

/** Whole-number percent of completed lessons, 0–100. */
export function percentComplete(completedCount: number, totalCount: number): number {
  if (totalCount <= 0) return 0;
  const clamped = Math.min(Math.max(completedCount, 0), totalCount);
  return Math.round((clamped / totalCount) * 100);
}

/** First lesson the learner has not finished yet, in curriculum order. */
export function nextLesson(chapters: Chapter[], completedIds: Set<string>): Lesson | null {
  for (const chapter of chapters) {
    for (const lesson of chapter.lessons) {
      if (!completedIds.has(lesson.id)) return lesson;
    }
  }
  return null;
}

/** Lesson that follows `lessonId` in curriculum order, or null at the end. */
export function followingLesson(chapters: Chapter[], lessonId: string): Lesson | null {
  const flat = chapters.flatMap((c) => c.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index === -1 || index === flat.length - 1) return null;
  return flat[index + 1];
}

/** Lesson that precedes `lessonId` in curriculum order, or null at the start. */
export function previousLesson(chapters: Chapter[], lessonId: string): Lesson | null {
  const flat = chapters.flatMap((c) => c.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);
  if (index <= 0) return null;
  return flat[index - 1];
}

/** Clamp a step index into the valid range for a step list. */
export function clampStep(step: number, stepCount: number): number {
  if (stepCount <= 0) return 0;
  return Math.min(Math.max(step, 0), stepCount - 1);
}

/** Next step index, staying on the last step instead of overflowing. */
export function nextStepIndex(current: number, stepCount: number): number {
  return clampStep(current + 1, stepCount);
}

/** Previous step index, staying on the first step instead of underflowing. */
export function prevStepIndex(current: number, stepCount: number): number {
  return clampStep(current - 1, stepCount);
}

/**
 * Little's Law: average number of items in a system (L) equals the
 * average arrival rate (lambda, items/sec) times the average time an
 * item spends in the system (W, seconds). L = λW.
 */
export function littlesLaw(arrivalRatePerSec: number, avgTimeSec: number): number {
  if (arrivalRatePerSec < 0 || avgTimeSec < 0) return 0;
  return arrivalRatePerSec * avgTimeSec;
}

/**
 * Utilization of a single server: arrival rate × service time.
 * At or above 1 the queue grows without bound — that is the point
 * of the Latency & Throughput lesson.
 */
export function utilization(arrivalRatePerSec: number, serviceTimeSec: number): number {
  if (arrivalRatePerSec < 0 || serviceTimeSec < 0) return 0;
  return arrivalRatePerSec * serviceTimeSec;
}

/** Capacity-planning math for the calculator. All results are estimates. */
export interface CapacityInputs {
  dailyActiveUsers: number;
  requestsPerUserPerDay: number;
  peakMultiplier: number;
  avgPayloadKb: number;
  readWriteRatio: number; // reads per 1 write, e.g. 9 means 9 reads : 1 write
  storagePerUserMb: number;
  retentionDays: number;
  serverCapacityRps: number;
}

export interface CapacityOutputs {
  requestsPerDay: number;
  avgRps: number;
  peakRps: number;
  bandwidthMbps: number;
  storageGb: number;
  readRps: number;
  writeRps: number;
  serversNeeded: number;
}

export function calculateCapacity(input: CapacityInputs): CapacityOutputs {
  const safe = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);
  const dau = safe(input.dailyActiveUsers);
  const rpu = safe(input.requestsPerUserPerDay);
  const peak = safe(input.peakMultiplier) || 1;
  const payloadKb = safe(input.avgPayloadKb);
  const ratio = safe(input.readWriteRatio);
  const storageMb = safe(input.storagePerUserMb);
  const retention = safe(input.retentionDays);
  const serverRps = safe(input.serverCapacityRps) || 1;

  const requestsPerDay = dau * rpu;
  const avgRps = requestsPerDay / 86400;
  const peakRps = avgRps * peak;
  // Mbps: bytes per second × 8 bits, averaged over the day at peak rate.
  const bandwidthMbps = (peakRps * payloadKb * 1024 * 8) / 1_000_000;
  const storageGb = (dau * storageMb * retention) / 1024;
  const readShare = ratio / (ratio + 1);
  const readRps = peakRps * readShare;
  const writeRps = peakRps * (1 - readShare);
  const serversNeeded = Math.max(1, Math.ceil(peakRps / serverRps));

  return { requestsPerDay, avgRps, peakRps, bandwidthMbps, storageGb, readRps, writeRps, serversNeeded };
}
