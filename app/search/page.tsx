import { Suspense } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { searchEntries } from '@/lib/content';
import { SearchBox } from '@/components/ui/SearchBox';
import { Card } from '@/components/ui/Card';
import type { SearchEntry } from '@/lib/types';

const KIND_LABELS: Record<SearchEntry['kind'], string> = {
  lesson: 'Lessons',
  cheatsheet: 'Cheatsheets',
  'case-study': 'Case studies',
  quiz: 'Quizzes',
};

const KIND_ORDER: SearchEntry['kind'][] = ['lesson', 'cheatsheet', 'case-study', 'quiz'];

function groupByKind(results: SearchEntry[]) {
  const groups = new Map<SearchEntry['kind'], SearchEntry[]>();
  for (const entry of results) {
    const list = groups.get(entry.kind) ?? [];
    list.push(entry);
    groups.set(entry.kind, list);
  }
  return groups;
}

async function SearchResults({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? '').trim();
  const results = query.length > 0 ? searchEntries(query) : [];
  const groups = groupByKind(results);

  return (
    <>
      <div className="mt-6">
        <SearchBox defaultValue={query} />
      </div>
      {query.length === 0 ? (
        <Card className="mt-8 p-6 text-center">
          <Search className="mx-auto h-8 w-8 text-muted" aria-hidden />
          <p className="mt-3 font-bold">Type something to search</p>
          <p className="mt-1 text-sm text-muted">
            Try “cache”, “load balancing”, or “replication”.
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Card className="mt-8 p-6 text-center">
          <p className="font-bold">No results for “{query}”</p>
          <p className="mt-1 text-sm text-muted">
            Check the spelling, or try a broader word like “database” or “scaling”.
          </p>
          <p className="mt-4">
            <Link href="/learn" className="font-display text-sm font-bold text-ink hover:underline">
              Browse the curriculum instead →
            </Link>
          </p>
        </Card>
      ) : (
        <div className="mt-8 space-y-8">
          <p className="text-sm text-muted">
            {results.length} result{results.length === 1 ? '' : 's'} for “{query}”
          </p>
          {KIND_ORDER.filter((kind) => groups.has(kind)).map((kind) => (
            <section key={kind} aria-label={KIND_LABELS[kind]}>
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-muted">
                {KIND_LABELS[kind]}
              </h2>
              <ul className="mt-3 space-y-3">
                {groups.get(kind)?.map((entry) => (
                  <li key={`${entry.kind}-${entry.id}`}>
                    <Link href={entry.href}>
                      <Card className="p-4 transition-shadow hover:shadow-offset">
                        <p className="font-bold">{entry.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                          {entry.subtitle}
                        </p>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/*
 * The search box and header render immediately; the results read the
 * query string, so they sit behind Suspense — without the boundary
 * Next cannot prerender this route.
 */
export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <header>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          Search
        </p>
        <h1 className="mt-2 text-3xl font-bold">Find a topic</h1>
      </header>

      <Suspense
        fallback={
          <Card className="mt-8 p-6 text-center">
            <p className="text-sm text-muted">Searching…</p>
          </Card>
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
