'use client';

/*
 * Cheatsheet library: search and filter over the sheets in `data/cheatsheets`.
 * Filtering runs in the browser so typing feels instant. While the library
 * is empty (content still being written) we say so plainly instead of
 * showing placeholder cards.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { cheatsheets } from '@/lib/content';
import type { Difficulty } from '@/lib/types';

const ALL = 'All';

function badgeTone(difficulty: Difficulty): string {
  if (difficulty === 'Beginner') return 'bg-leaf';
  if (difficulty === 'Intermediate') return 'bg-amber';
  return 'bg-lilac';
}

export default function CheatsheetsPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);

  const categories = useMemo(() => {
    const seen: string[] = [];
    for (const sheet of cheatsheets) {
      if (!seen.includes(sheet.category)) seen.push(sheet.category);
    }
    return [ALL, ...seen];
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cheatsheets.filter((sheet) => {
      const inCategory = category === ALL || sheet.category === category;
      if (!inCategory) return false;
      if (!q) return true;
      const haystack = `${sheet.title} ${sheet.summary} ${sheet.category}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">
          Home
        </Link>
        <Link href="/cheatsheets" aria-current="page" className="font-semibold underline underline-offset-4">
          Cheatsheets
        </Link>
        <Link href="/case-studies" className="text-muted underline-offset-4 hover:underline">
          Case Studies
        </Link>
        <Link href="/calculator" className="text-muted underline-offset-4 hover:underline">
          Calculator
        </Link>
      </nav>

      <p className="font-display text-sm text-muted">Quick reference</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Cheatsheets</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Short, scannable summaries of the ideas each lesson teaches — the formula, the rule of
        thumb, and when to reach for it.
      </p>

      {cheatsheets.length === 0 ? (
        <div className="mt-10 rounded-lg border border-line bg-surface p-8 shadow-offset">
          <h2 className="text-xl font-bold">No cheatsheets yet</h2>
          <p className="mt-2 text-muted">
            Cheatsheets are still being written. Check back soon — new sheets land alongside
            their lessons.
          </p>
          <Link
            href="/calculator"
            className="mt-5 inline-block rounded-md border border-ink bg-leaf px-4 py-2 text-sm font-semibold shadow-offset"
          >
            Try the capacity calculator instead
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <label htmlFor="cheatsheet-search" className="sr-only">
              Search cheatsheets
            </label>
            <input
              id="cheatsheet-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title, summary, or category…"
              className="w-full rounded-md border border-line bg-surface px-4 py-2.5 text-ink placeholder:text-muted sm:max-w-md"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            {categories.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCategory(name)}
                aria-pressed={category === name}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  category === name
                    ? 'border-ink bg-ink text-bg'
                    : 'border-line bg-surface text-ink hover:border-ink'
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <div className="mt-10 rounded-lg border border-line bg-surface p-8 shadow-offset">
              <h2 className="text-xl font-bold">No cheatsheets match that search</h2>
              <p className="mt-2 text-muted">
                Try a different word, or clear the category filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategory(ALL);
                }}
                className="mt-5 rounded-md border border-ink bg-leaf px-4 py-2 text-sm font-semibold shadow-offset"
              >
                Clear search and filters
              </button>
            </div>
          ) : (
            <>
              <p className="mt-6 text-sm text-muted" aria-live="polite">
                Showing {visible.length} of {cheatsheets.length} cheatsheets.
              </p>
              <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                {visible.map((sheet) => (
                  <li key={sheet.id}>
                    <Link
                      href={`/cheatsheets/${sheet.id}`}
                      className="block h-full rounded-lg border border-line bg-surface p-5 shadow-offset transition-transform hover:-translate-y-0.5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {sheet.category}
                      </p>
                      <h2 className="mt-2 text-lg font-bold leading-snug">{sheet.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{sheet.summary}</p>
                      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`rounded-full border border-line px-2.5 py-1 font-semibold ${badgeTone(sheet.difficulty)}`}
                        >
                          {sheet.difficulty}
                        </span>
                        <span className="text-muted">{sheet.readMin} min read</span>
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </main>
  );
}
