/*
 * Case study library: one card per design problem, with a link into the
 * full walkthrough. While no case studies are published yet, the page says
 * so plainly instead of inventing entries.
 */

import Link from 'next/link';
import { caseStudies } from '@/lib/content';
import type { Difficulty } from '@/lib/types';

function badgeTone(difficulty: Difficulty): string {
  if (difficulty === 'Beginner') return 'bg-leaf';
  if (difficulty === 'Intermediate') return 'bg-amber';
  return 'bg-lilac';
}

export default function CaseStudiesPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Sections" className="mb-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <Link href="/" className="text-muted underline-offset-4 hover:underline">
          Home
        </Link>
        <Link href="/cheatsheets" className="text-muted underline-offset-4 hover:underline">
          Cheatsheets
        </Link>
        <Link href="/case-studies" aria-current="page" className="font-semibold underline underline-offset-4">
          Case Studies
        </Link>
        <Link href="/calculator" className="text-muted underline-offset-4 hover:underline">
          Calculator
        </Link>
      </nav>

      <p className="font-display text-sm text-muted">Design it yourself, then compare</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Case Studies</h1>
      <p className="mt-3 max-w-2xl text-muted">
        Real systems, broken down the way an interviewer would: the problem, the numbers,
        the API, the data model, and the trade-offs. Read the problem first and sketch your
        own design before scrolling to the walkthrough.
      </p>

      {caseStudies.length === 0 ? (
        <div className="mt-10 rounded-lg border border-line bg-surface p-8 shadow-offset">
          <h2 className="text-xl font-bold">No case studies yet</h2>
          <p className="mt-2 text-muted">
            The first case study is still being written. In the meantime, the cheatsheets
            cover the building blocks you will need.
          </p>
          <Link
            href="/cheatsheets"
            className="mt-5 inline-block rounded-md border border-ink bg-leaf px-4 py-2 text-sm font-semibold shadow-offset"
          >
            Browse cheatsheets
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {caseStudies.map((study) => (
            <li key={study.id} className="flex">
              <article className="flex w-full flex-col rounded-lg border border-line bg-surface p-5 shadow-offset">
                <h2 className="text-lg font-bold leading-snug">{study.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {study.problem}
                </p>
                <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`rounded-full border border-line px-2.5 py-1 font-semibold ${badgeTone(study.difficulty)}`}
                  >
                    {study.difficulty}
                  </span>
                  <span className="text-muted">About {study.estMin} min</span>
                </p>
                <Link
                  href={`/case-studies/${study.id}`}
                  className="mt-5 inline-block rounded-md border border-ink bg-amber px-4 py-2 text-center text-sm font-semibold shadow-offset"
                >
                  Start Design
                </Link>
              </article>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
