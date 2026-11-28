'use client';

/*
 * MetricStrip: one compact card per simulation metric.
 * Tone is shown with colour and a small text marker together —
 * colour is never the only signal.
 */

import type { SimMetric } from '@/lib/types';

const TONE_CLASS: Record<NonNullable<SimMetric['tone']>, string> = {
  default: 'border-line bg-surface',
  good: 'border-line bg-leaf',
  warn: 'border-line bg-amber',
  bad: 'border-line bg-surface',
};

/** Short text marker shown next to warn and bad values. */
const TONE_MARKER: Partial<Record<NonNullable<SimMetric['tone']>, string>> = {
  good: 'Good',
  warn: 'Watch',
  bad: 'Attention',
};

export function MetricStrip({ metrics }: { metrics: SimMetric[] }) {
  if (metrics.length === 0) return null;
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Step metrics">
      {metrics.map((metric) => {
        const tone = metric.tone ?? 'default';
        const marker = TONE_MARKER[tone];
        return (
          <div
            key={metric.label}
            className={`rounded-lg border p-3 ${TONE_CLASS[tone]}`}
          >
            <dt className="text-xs text-muted">{metric.label}</dt>
            <dd className="mt-1 font-display text-base font-bold leading-snug break-words text-ink sm:text-lg">
              {metric.value}
              {metric.unit ? <span className="ml-1 text-sm font-normal text-muted">{metric.unit}</span> : null}
            </dd>
            {marker ? (
              <dd className={`mt-1 text-xs font-bold ${tone === 'bad' ? 'text-danger' : 'text-ink'}`}>
                {marker}
              </dd>
            ) : null}
          </div>
        );
      })}
    </dl>
  );
}
