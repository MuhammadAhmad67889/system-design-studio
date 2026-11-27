/*
 * One case study, in the order a designer works through it: problem,
 * requirements, estimates, API, data model, architecture, trade-offs,
 * bottlenecks. Unknown ids 404.
 */

import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { caseStudies, getCaseStudy } from '@/lib/content';
import type { Difficulty } from '@/lib/types';

export function generateStaticParams() {
  return caseStudies.map((study) => ({ id: study.id }));
}

function badgeTone(difficulty: Difficulty): string {
  if (difficulty === 'Beginner') return 'bg-leaf';
  if (difficulty === 'Intermediate') return 'bg-amber';
  return 'bg-lilac';
}

function Section({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-surface p-6 shadow-offset">
      <h2 className="text-xl font-bold">{title}</h2>
      {intro && <p className="mt-2 text-sm leading-relaxed text-muted">{intro}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const study = getCaseStudy(id);

  if (!study) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <Link href="/case-studies" className="text-muted underline-offset-4 hover:underline">
          ← All case studies
        </Link>
      </nav>

      <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{study.title}</h1>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border border-line px-2.5 py-1 font-semibold ${badgeTone(study.difficulty)}`}
        >
          {study.difficulty}
        </span>
        <span className="text-muted">About {study.estMin} min</span>
      </p>

      <div className="mt-10 space-y-8">
        <Section title="1. The problem">
          <p className="leading-relaxed">{study.problem}</p>
        </Section>

        <Section
          title="2. Requirements"
          intro="Check each one off as your design covers it. If a requirement is vague, write down the assumption you are making."
        >
          <ul className="space-y-2.5">
            {study.requirements.map((requirement) => (
              <li key={requirement} className="flex items-start gap-3 leading-relaxed">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line bg-leaf text-xs font-bold"
                >
                  ✓
                </span>
                {requirement}
              </li>
            ))}
          </ul>
        </Section>

        <Section
          title="3. Back-of-the-envelope estimates"
          intro="These numbers are assumptions for working through the design, not measured traffic. Change them and the design should still hold up."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-80 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    What
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Estimate
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {study.estimates.map((row) => (
                  <tr key={row.label} className="border-b border-line last:border-b-0">
                    <td className="py-2.5 pr-4 font-medium">{row.label}</td>
                    <td className="py-2.5 pr-4 font-mono text-sm">{row.value}</td>
                    <td className="py-2.5 text-muted">{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="4. API design">
          <div className="overflow-x-auto">
            <table className="w-full min-w-80 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Method
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Path
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    What it does
                  </th>
                </tr>
              </thead>
              <tbody>
                {study.apis.map((api) => (
                  <tr key={`${api.method} ${api.path}`} className="border-b border-line last:border-b-0">
                    <td className="py-2.5 pr-4">
                      <code className="rounded border border-line bg-bg px-2 py-0.5 font-mono text-xs font-semibold">
                        {api.method}
                      </code>
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-sm break-all">{api.path}</td>
                    <td className="py-2.5 text-muted">{api.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="5. Data model">
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            {study.dataModel.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>

        <Section title="6. Architecture">
          <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
            {study.architecture.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </Section>

        <Section
          title="7. Trade-offs"
          intro="Every choice gives something up. The pro is what you gain; the con is what you pay."
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-80 border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Choice
                  </th>
                  <th scope="col" className="py-2 pr-4 font-semibold">
                    Pro
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Con
                  </th>
                </tr>
              </thead>
              <tbody>
                {study.tradeoffs.map((row) => (
                  <tr key={row.choice} className="border-b border-line last:border-b-0">
                    <td className="py-2.5 pr-4 font-medium">{row.choice}</td>
                    <td className="py-2.5 pr-4 text-muted">{row.pro}</td>
                    <td className="py-2.5 text-muted">{row.con}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="8. Bottlenecks">
          <ul className="list-disc space-y-2 pl-5 leading-relaxed">
            {study.bottlenecks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Section>
      </div>

      <p className="mt-10">
        <Link href="/case-studies" className="text-sm font-semibold underline underline-offset-4">
          Back to all case studies
        </Link>
      </p>
    </main>
  );
}
