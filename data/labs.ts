/*
 * Guided labs: one hands-on exercise per chapter, 9 total.
 * Content lives in data/labs-part-a.ts (labs 1–3), -b (labs 4–6)
 * and -c (labs 7–9); this file merges them in chapter order.
 */

import type { Lab } from '@/lib/types';
import { labsPartA } from '@/data/labs-part-a';
import { labsPartB } from '@/data/labs-part-b';
import { labsPartC } from '@/data/labs-part-c';

export const allLabs: Lab[] = [...labsPartA, ...labsPartB, ...labsPartC].sort(
  (a, b) => a.number - b.number,
);

/** Total lab count — the spec fixes this at 9, one per chapter. */
export const TOTAL_LABS = 9;
