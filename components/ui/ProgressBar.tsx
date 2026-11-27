interface ProgressBarProps {
  /** Completed percent, 0–100. Values outside the range are clamped. */
  value: number;
  label: string;
  showPercent?: boolean;
}

export function ProgressBar({ value, label, showPercent = false }: ProgressBarProps) {
  const clamped = Math.min(Math.max(Math.round(value), 0), 100);

  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        className="h-3 w-full overflow-hidden rounded-full border border-line bg-raised"
      >
        <div className="h-full rounded-full bg-leaf-deep transition-all" style={{ width: `${clamped}%` }} />
      </div>
      {showPercent ? (
        <p className="mt-1 text-right font-mono text-xs text-muted">{clamped}%</p>
      ) : null}
    </div>
  );
}
