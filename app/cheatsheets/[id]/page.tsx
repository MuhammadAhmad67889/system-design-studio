/*
 * One cheatsheet, section by section. Formulas get a copy button because
 * learners paste them into their own notes. Unknown ids 404.
 */

import Link from 'next/link';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { cheatsheets, getCheatsheet, getLesson } from '@/lib/content';
import type { Difficulty } from '@/lib/types';

export function generateStaticParams() {
  return cheatsheets.map((sheet) => ({ id: sheet.id }));
}

function badgeTone(difficulty: Difficulty): string {
  if (difficulty === 'Beginner') return 'bg-leaf';
  if (difficulty === 'Intermediate') return 'bg-amber';
  return 'bg-lilac';
}

export default async function CheatsheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheet = getCheatsheet(id);

  if (!sheet) {
    notFound();
  }

  const relatedLessons = (sheet.relatedLessons ?? [])
    .map((lessonId) => getLesson(lessonId))
    .filter((lesson): lesson is NonNullable<typeof lesson> => lesson !== undefined);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-8 text-sm">
        <Link href="/cheatsheets" className="text-muted underline-offset-4 hover:underline">
          ← All cheatsheets
        </Link>
      </nav>

      <p className="font-display text-sm text-muted">{sheet.category}</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{sheet.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">{sheet.summary}</p>
      <p className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`rounded-full border border-line px-2.5 py-1 font-semibold ${badgeTone(sheet.difficulty)}`}
        >
          {sheet.difficulty}
        </span>
        <span className="text-muted">{sheet.readMin} min read</span>
      </p>

      <div className="mt-10 space-y-8">
        {sheet.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-lg border border-line bg-surface p-6 shadow-offset"
          >
            <h2 className="text-xl font-bold">{section.heading}</h2>
            <p className="mt-3 leading-relaxed">{section.body}</p>
            {section.bullets && section.bullets.length > 0 && (
              <ul className="mt-4 list-disc space-y-2 pl-5 leading-relaxed">
                {section.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
            {section.formula && (
              <div className="mt-4 flex items-start justify-between gap-3 rounded-md border border-line bg-bg p-4">
                <code className="font-mono text-sm leading-relaxed break-words">
                  {section.formula}
                </code>
                <button
                  type="button"
                  data-copy={section.formula}
                  className="shrink-0 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold hover:border-ink"
                >
                  Copy
                </button>
              </div>
            )}
          </section>
        ))}
      </div>

      {relatedLessons.length > 0 && (
        <section className="mt-10" aria-labelledby="related-lessons">
          <h2 id="related-lessons" className="text-xl font-bold">
            Related lessons
          </h2>
          <ul className="mt-4 space-y-3">
            {relatedLessons.map((lesson) => (
              <li key={lesson.id}>
                <Link
                  href={`/learn/${lesson.id}`}
                  className="block rounded-lg border border-line bg-surface p-4 shadow-offset hover:-translate-y-0.5 transition-transform"
                >
                  <span className="font-semibold">
                    Lesson {lesson.number}: {lesson.title}
                  </span>
                  <span className="mt-1 block text-sm text-muted">{lesson.intro}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10">
        <Link href="/cheatsheets" className="text-sm font-semibold underline underline-offset-4">
          Back to all cheatsheets
        </Link>
      </p>

      {/*
       * Why a plain script instead of a React button: this page must stay a
       * server component so it can export generateStaticParams, and the copy
       * buttons are the only thing on it that needs browser JavaScript. One
       * delegated listener covers every formula on the page, and it keeps
       * working across client-side navigation between cheatsheets.
       */}
      <Script id="copy-formula">
        {`
          document.addEventListener('click', function (event) {
            var button = event.target.closest('[data-copy]');
            if (!button || button.dataset.copying) return;
            button.dataset.copying = 'true';
            navigator.clipboard.writeText(button.getAttribute('data-copy')).then(function () {
              button.textContent = 'Copied';
              setTimeout(function () {
                button.textContent = 'Copy';
                delete button.dataset.copying;
              }, 1500);
            }).catch(function () {
              delete button.dataset.copying;
            });
          });
        `}
      </Script>
    </main>
  );
}
