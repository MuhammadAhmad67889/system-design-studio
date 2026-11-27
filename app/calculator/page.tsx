'use client';

/*
 * Back-of-the-envelope capacity calculator. Every keystroke recomputes
 * the outputs through `calculateCapacity` in lib/progress.ts, so the
 * numbers on screen are always the numbers for the inputs on screen.
 * Nothing here is a sizing recommendation — the notice below the results
 * says so in plain words.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { calculateCapacity } from '@/lib/progress';

interface Field {
  key: string;
  label: string;
  hint: string;
  defaultValue: string;
}

const FIELDS: Field[] = [
  { key: 'dailyActiveUsers', label: 'Daily active users', hint: 'People using the system each day', defaultValue: '1000000' },
  { key: 'requestsPerUserPerDay', label: 'Requests per user per day', hint: 'Average requests one user makes in a day', defaultValue: '20' },
  { key: 'peakMultiplier', label: 'Peak multiplier', hint: 'How much busier the busiest hour is than the average', defaultValue: '3' },
  { key: 'avgPayloadKb', label: 'Average payload (KB)', hint: 'Average size of one request and response, in kilobytes', defaultValue: '2' },
  { key: 'readWriteRatio', label: 'Read/write ratio', hint: 'Reads per 1 write — 9 means 9 reads for every 1 write', defaultValue: '9' },
  { key: 'storagePerUserMb', label: 'Storage per user (MB)', hint: 'New data stored per user, in megabytes', defaultValue: '10' },
  { key: 'retentionDays', label: 'Retention (days)', hint: 'How long data is kept before it can be deleted', defaultValue: '365' },
  { key: 'serverCapacityRps', label: 'Server capacity (RPS)', hint: 'Requests per second one server can handle', defaultValue: '1000' },
];

/** Parse a field value: only non-negative numbers count, anything else is 0. */
function parseValue(raw: string): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return value;
}

function isValid(raw: string): boolean {
  if (raw.trim() === '') return false;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0;
}

function formatWhole(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

function formatDecimal(value: number): string {
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

export default function CalculatorPage() {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of FIELDS) initial[field.key] = field.defaultValue;
    return initial;
  });

  const results = useMemo(
    () =>
      calculateCapacity({
        dailyActiveUsers: parseValue(values.dailyActiveUsers),
        requestsPerUserPerDay: parseValue(values.requestsPerUserPerDay),
        peakMultiplier: parseValue(values.peakMultiplier),
        avgPayloadKb: parseValue(values.avgPayloadKb),
        readWriteRatio: parseValue(values.readWriteRatio),
        storagePerUserMb: parseValue(values.storagePerUserMb),
        retentionDays: parseValue(values.retentionDays),
        serverCapacityRps: parseValue(values.serverCapacityRps),
      }),
    [values],
  );

  function updateField(key: string, raw: string) {
    setValues((current) => ({ ...current, [key]: raw }));
  }

  function resetDefaults() {
    const initial: Record<string, string> = {};
    for (const field of FIELDS) initial[field.key] = field.defaultValue;
    setValues(initial);
  }

  const outputs: { label: string; value: string; unit: string; formula: string }[] = [
    {
      label: 'Requests per day',
      value: formatWhole(results.requestsPerDay),
      unit: 'requests',
      formula: 'DAU × requests per user per day',
    },
    {
      label: 'Average RPS',
      value: formatDecimal(results.avgRps),
      unit: 'req/sec',
      formula: 'requests per day ÷ 86,400 seconds',
    },
    {
      label: 'Peak RPS',
      value: formatDecimal(results.peakRps),
      unit: 'req/sec',
      formula: 'average RPS × peak multiplier',
    },
    {
      label: 'Bandwidth at peak',
      value: formatDecimal(results.bandwidthMbps),
      unit: 'Mbps',
      formula: 'peak RPS × payload KB × 1024 × 8 ÷ 1,000,000',
    },
    {
      label: 'Storage needed',
      value: formatDecimal(results.storageGb),
      unit: 'GB',
      formula: 'DAU × storage per user MB × retention days ÷ 1024',
    },
    {
      label: 'Read RPS at peak',
      value: formatDecimal(results.readRps),
      unit: 'req/sec',
      formula: 'peak RPS × ratio ÷ (ratio + 1)',
    },
    {
      label: 'Write RPS at peak',
      value: formatDecimal(results.writeRps),
      unit: 'req/sec',
      formula: 'peak RPS × 1 ÷ (ratio + 1)',
    },
    {
      label: 'Servers needed',
      value: formatWhole(results.serversNeeded),
      unit: 'servers',
      formula: 'peak RPS ÷ server capacity RPS, rounded up',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">
          Home
        </Link>
        <Link href="/cheatsheets" className="text-muted underline-offset-4 hover:underline">
          Cheatsheets
        </Link>
        <Link href="/case-studies" className="text-muted underline-offset-4 hover:underline">
          Case Studies
        </Link>
        <Link href="/calculator" aria-current="page" className="font-semibold underline underline-offset-4">
          Calculator
        </Link>
      </nav>

      <p className="font-display text-sm text-muted">Back-of-the-envelope math</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Capacity Calculator</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Plug in rough numbers for a system and see the scale it implies — requests per second,
        bandwidth, storage, and how many servers that pace would need. Results update as you
        type.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="inputs-heading">
          <h2 id="inputs-heading" className="text-xl font-bold">
            Your numbers
          </h2>
          <div className="mt-4 space-y-5">
            {FIELDS.map((field) => {
              const valid = isValid(values[field.key]);
              return (
                <div key={field.key}>
                  <label
                    htmlFor={`input-${field.key}`}
                    className="block text-sm font-semibold"
                  >
                    {field.label}
                  </label>
                  <p className="mt-0.5 text-xs text-muted">{field.hint}</p>
                  <input
                    id={`input-${field.key}`}
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={values[field.key]}
                    onChange={(event) => updateField(field.key, event.target.value)}
                    aria-invalid={!valid}
                    aria-describedby={valid ? undefined : `error-${field.key}`}
                    className="mt-1.5 w-full rounded-md border border-line bg-surface px-4 py-2.5 font-mono text-ink"
                  />
                  {!valid && (
                    <p id={`error-${field.key}`} className="mt-1 text-xs font-medium text-danger">
                      Enter a number of 0 or above.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={resetDefaults}
            className="mt-6 rounded-md border border-ink bg-surface px-4 py-2 text-sm font-semibold shadow-offset hover:bg-leaf"
          >
            Reset to example values
          </button>
        </section>

        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="text-xl font-bold">
            Results
          </h2>
          <dl className="mt-4 space-y-3">
            {outputs.map((output) => (
              <div
                key={output.label}
                className="rounded-lg border border-line bg-surface p-4 shadow-offset"
              >
                <dt className="text-sm font-semibold">{output.label}</dt>
                <dd className="mt-1 font-mono text-2xl font-semibold">
                  {output.value}{' '}
                  <span className="text-sm font-normal text-muted">{output.unit}</span>
                </dd>
                <dd className="mt-1 font-mono text-xs text-muted">{output.formula}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 rounded-lg border border-amber bg-amber/25 p-4 text-sm leading-relaxed">
            <strong>These are estimates, not infrastructure requirements.</strong> Real traffic
            is uneven, payloads vary, and one server&apos;s capacity depends on what the code
            actually does. Use these numbers to sanity-check a design, then measure the real
            system before buying or provisioning anything.
          </p>
        </section>
      </div>
    </main>
  );
}
