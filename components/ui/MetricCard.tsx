import type { SimMetric } from '@/lib/types';

type MetricTone = NonNullable<SimMetric['tone']>;

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  tone?: MetricTone;
}

const toneClasses: Record<MetricTone, string> = {
  default: 'text-ink',
  good: 'text-healthy',
  warn: 'text-amber',
  bad: 'text-danger',
};

/*
 * One number with a label, for the lesson metric strip and the
 * homepage stats. Tone colors the value but the label always
 * carries the meaning, so color is never the only signal.
 */
export function MetricCard({ label, value, unit, tone = 'default' }: MetricCardProps) {
  return (
    <div className="rounded-xl border-[1.5px] border-line bg-raised px-4 py-3">
      <p className="font-display text-xs font-bold uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-1 font-mono text-2xl font-semibold ${toneClasses[tone]}`}>
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-muted">{unit}</span> : null}
      </p>
    </div>
  );
}
